// PostToolUse (Edit|Write|MultiEdit) em rotas da API: avisa o Claude quando uma rota nova ou alterada
// está sem `summary` e `description` no schema (OpenAPI). Rotas antigas não alteradas são ignoradas.
import { execSync } from "node:child_process"
import { readFileSync, existsSync } from "node:fs"
import { dirname, basename } from "node:path"

let input = ""
for await (const chunk of process.stdin) input += chunk
const filePath = JSON.parse(input || "{}")?.tool_input?.file_path || ""
const normalized = filePath.replaceAll("\\", "/")
if (!/apps\/api\/src\/app\/http\/routes\/[^/]+\.routes\.ts$/.test(normalized) || !existsSync(filePath)) {
  process.exit(0)
}
// Rotas de demonstração não entram na regra.
if (/(example|error-example|internal-metrics)\.routes\.ts$/.test(normalized)) process.exit(0)

const lines = readFileSync(filePath, "utf8").split(/\r?\n/)

// Linhas adicionadas ou alteradas segundo o git (arquivo novo: todas).
const touched = new Set()
try {
  const cwd = dirname(filePath)
  const tracked = (() => {
    try {
      execSync(`git ls-files --error-unmatch "${basename(filePath)}"`, { cwd, stdio: "ignore" })
      return true
    } catch {
      return false
    }
  })()
  if (!tracked) lines.forEach((_, i) => touched.add(i + 1))
  else {
    const diff = execSync(`git diff -U0 HEAD -- "${basename(filePath)}"`, { cwd, encoding: "utf8" })
    for (const m of diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
      const start = Number(m[1])
      const count = m[2] === undefined ? 1 : Number(m[2])
      for (let i = start; i < start + count; i++) touched.add(i)
    }
  }
} catch {
  process.exit(0)
}

// Registro de rota: app.get('/x', ...), app.post(...), etc. O bloco vai até o próximo registro.
const ROUTE = /\b(?:app|fastify|server|instance)\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\2/
const starts = []
lines.forEach((line, i) => {
  const m = line.match(ROUTE)
  if (m) starts.push({ index: i, label: `${m[1].toUpperCase()} ${m[3]}` })
})

const problems = []
starts.forEach((route, n) => {
  const end = n + 1 < starts.length ? starts[n + 1].index - 1 : lines.length - 1
  const range = [...Array(end - route.index + 1).keys()].map((k) => route.index + k + 1)
  if (!range.some((line) => touched.has(line))) return
  const block = lines.slice(route.index, end + 1).join("\n")
  // `options` compartilhado (ex.: plan.routes.ts) já pode trazer o schema: só cobra quando há schema inline.
  const usesSharedOptions = /,\s*(options|authOptions|routeOptions)\s*,/.test(block) && !/schema\s*:/.test(block)
  if (usesSharedOptions) return
  if (!/schema\s*:/.test(block)) problems.push(`${route.label}: sem schema`)
  else {
    if (!/summary\s*:/.test(block)) problems.push(`${route.label}: schema sem summary`)
    if (!/description\s*:/.test(block)) problems.push(`${route.label}: schema sem description`)
    if (!/tags\s*:/.test(block)) problems.push(`${route.label}: schema sem tags`)
  }
})

if (problems.length) {
  process.stderr.write(
    `OpenAPI desatualizado em ${basename(filePath)}:\n- ${problems.join("\n- ")}\n` +
      "Inclua tags, summary e description com papéis, plano (operationalFeature) e erros. Ver .claude/rules/padroes/documentacao.md\n"
  )
  process.exit(2)
}
process.exit(0)
