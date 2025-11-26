import express from "express";
import bodyParser from "body-parser";
import { runSpeckitTool } from "./mcpRunner.js";
import { autoCommit } from "./gitCommit.js";

const app = express();
app.use(bodyParser.json({ limit: "10mb" }));

app.get("/", (req, res) => res.send("Speckit wrapper running"));

app.post("/run", async (req, res) => {
  const { tool, prompt, repo_url, repo_branch = "main", repo_path, auto_commit } = req.body;

  if (!tool) return res.status(400).json({ error: "tool is required" });

  try {
    const result = await runSpeckitTool(tool, prompt || "");

    let commitResult = null;
    if (auto_commit && repo_url && repo_path) {
      commitResult = await autoCommit(repo_url, repo_branch, repo_path, result.files || []);
    }

    res.json({
      status: "success",
      tool,
      prompt,
      result,
      commit: commitResult
    });
  } catch (err) {
    console.error("Error in /run:", err);
    res.status(500).json({ status: "error", error: (err && err.message) || String(err) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Speckit wrapper listening on port ${port}`);
});
