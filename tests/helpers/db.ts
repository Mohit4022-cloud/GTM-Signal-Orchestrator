import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

export function resetDatabase() {
  execFileSync(npmCommand, ["run", "db:seed"], {
    cwd: workspaceRoot,
    stdio: "pipe",
  });
}
