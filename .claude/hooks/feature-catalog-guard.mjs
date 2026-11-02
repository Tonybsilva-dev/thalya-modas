// PostToolUse (Edit|Write|MultiEdit) em feature-catalog.ts: confere que toda funcionalidade `available: true`
// do catálogo é protegida por alguma regra em operationalFeature(). Funcionalidade sem gate = acesso livre.
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"

let input = ""
for await (const chunk of process.stdin) input += chunk
const filePath = (JSON.parse(input || "{}")?.tool_input?.file_path || "").replaceAll("\\", "/")
if (!/core\/domain\/feature-catalog\.ts$/.test(filePath)) process.exit(0)

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()
const catalogPath = join(root, "apps/api/src/core/domain/feature-catalog.ts")
if (!existsSync(catalogPath)) process.exit(0)

const source = readFileSync(catalogPath, "utf8")
const [catalogPart, gatePart = ""] = source.split(/export function operationalFeature/)

const available = [...catalogPart.matchAll(/key:\s*'([a-z]+\.[A-Za-z]+)'[^}]*?available:\s*true/gs)].map((m) => m[1])
const gated = new Set([...gatePart.matchAll(/return\s+'([a-z]+\.[A-Za-z]+)'/g)].map((m) => m[1]))

const ungated = available.filter((key) => !gated.has(key))
if (ungated.length) {
  process.stderr.write(
    "Funcionalidades disponíveis no catálogo sem rota mapeada em operationalFeature():\n" +
      `- ${ungated.join(", ")}\n` +
      "Mapeie as rotas da funcionalidade (ou marque available: false se ainda está em desenvolvimento). Ver .claude/rules/padroes/planos-controles.md\n"
  )
  process.exit(2)
}
process.exit(0)
