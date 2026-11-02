// PreToolUse (Edit|Write|MultiEdit): bloqueia alteração de migration Prisma já versionada no git.
import { execSync } from "node:child_process"
import { dirname, basename } from "node:path"

let input = ""
for await (const chunk of process.stdin) input += chunk
const filePath = JSON.parse(input || "{}")?.tool_input?.file_path || ""
const normalized = filePath.replaceAll("\\", "/")

if (/\/prisma\/migrations\/\d{14}_[^/]+\/migration\.sql$/.test(normalized)) {
  let tracked = false
  try {
    execSync(`git ls-files --error-unmatch "${basename(filePath)}"`, { cwd: dirname(filePath), stdio: "ignore" })
    tracked = true
  } catch {
    tracked = false
  }
  if (tracked) {
    process.stderr.write(
      `Bloqueado: ${normalized.split("/").slice(-2).join("/")} já está versionada. Migration aplicada não pode ser editada. ` +
        "Crie uma nova com a skill nova-migration.\n"
    )
    process.exit(2)
  }
}
process.exit(0)
