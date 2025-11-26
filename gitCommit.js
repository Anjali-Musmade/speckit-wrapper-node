import simpleGit from "simple-git";
import fs from "fs";
import path from "path";
import os from "os";
import { tmpdir } from "os";

/**
 * autoCommit(repoUrl, branch, repoPath, files)
 * - repoUrl: full clone URL, may include token (https://x-access-token:TOKEN@github.com/owner/repo.git)
 * - branch: branch name to clone and push
 * - repoPath: path inside the repo where to write files (e.g. "specs")
 * - files: array of { path: "relative/path.md", content: "..." }
 */
export async function autoCommit(repoUrl, branch, repoPath, files = []) {
  const tmp = fs.mkdtempSync(path.join(tmpdir(), "speckit-"));
  const git = simpleGit();

  try {
    await git.clone(repoUrl, tmp, ["--branch", branch]);
    const absTarget = path.join(tmp, repoPath || ".");
    fs.mkdirSync(absTarget, { recursive: true });

    for (const f of files) {
      const dest = path.join(tmp, f.path);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, f.content, "utf8");
    }

    const repoGit = simpleGit(tmp);
    await repoGit.add("./*");
    await repoGit.commit("Auto: Speckit results");
    await repoGit.push("origin", branch);

    return { status: "committed", files_written: files.length };
  } finally {
    // Clean up
    try { await git.raw(["-C", tmp, "rm", "-rf", "."]); } catch {}
  }
}
