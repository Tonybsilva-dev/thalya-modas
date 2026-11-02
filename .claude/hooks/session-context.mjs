// SessionStart: diz ao Claude em que etapa da semana estamos e o estado do repositório.
import { execSync } from "node:child_process"
import { existsSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd()

const STAGES = {
  0: "Domingo · folga. Só emergência de produção (/diagnosticar-producao).",
  1: "Segunda · PLANEJAMENTO. Comece por /planejar-semana. Nenhum código antes de a spec estar no ClickUp.",
  2: "Terça · IMPLEMENTAÇÃO E TESTES. /implementar o próximo item da nota da semana; /coletar-feedback quando chegar retorno.",
  3: "Quarta · IMPLEMENTAÇÃO E TESTES. /implementar o próximo item da nota da semana; /coletar-feedback quando chegar retorno.",
  4: "Quinta · IMPLEMENTAÇÃO E TESTES. Feche os itens da semana com a Definição de Pronto completa.",
  5: "Sexta · BUG BOUNTY. /bug-bounty semana, mais pnpm audit e alertas do CodeQL/Dependabot.",
  6: "Sábado · FORTALECIMENTO. /fortalecer, depois /changelog e /retro-semana.",
}

function git(args) {
  try {
    return execSync(`git -C "${root}" ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim()
  } catch {
    return ""
  }
}

const lines = [`Etapa de hoje: ${STAGES[new Date().getDay()]}`]

if (existsSync(join(root, ".git"))) {
  const branch = git("branch --show-current")
  const changed = git("status --short").split("\n").filter(Boolean).length
  const ahead = git("rev-list --count @{u}..HEAD") || "?"
  lines.push(`store-flow: branch ${branch || "?"} · ${changed} arquivo(s) alterado(s) · ${ahead} commit(s) sem push`)
  if (branch === "preview-interface") {
    lines.push("Você está na branch padrão: crie feature/*, fix/* ou chore/* antes de editar (ver .claude/rules/git-flow.md).")
  }
}

// Nota da semana no Obsidian: sem ela, o planejamento de segunda foi pulado
const VAULT = "C:/Users/Antonio Silva/Desktop/Source/Source/01 - Projects/Agency/Store Flow"

function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
}

const week = isoWeek(new Date())
if (existsSync(VAULT) && new Date().getDay() !== 0 && !existsSync(join(VAULT, "05 - Semanas", `${week}.md`))) {
  lines.push(`Sem nota da semana (05 - Semanas/${week}.md): avise o usuário e sugira /planejar-semana antes de outra etapa.`)
}

const handoffDir = join(root, ".claude", "handoff")
if (existsSync(handoffDir)) {
  const last = readdirSync(handoffDir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ f, t: statSync(join(handoffDir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0]
  if (last) lines.push(`Último handoff: .claude/handoff/${last.f} (leia se o usuário for retomar trabalho).`)
}

process.stdout.write(
  JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: lines.join("\n") } })
)
