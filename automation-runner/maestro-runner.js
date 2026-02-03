#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const BASE_URL = process.env.NEXUSQA_BASE_URL || "http://localhost:3000";
const API_KEY = process.env.AUTOMATION_API_KEY;
const MAESTRO_CLI = process.env.MAESTRO_CLI_PATH || "maestro";
const CONFIG_PATH = process.env.MAESTRO_MAPPING_PATH || path.join(__dirname, "test-mapping.json");

if (!API_KEY) {
  console.error("[runner] Missing AUTOMATION_API_KEY in environment");
  process.exit(1);
}

function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error(`[runner] Config file not found: ${CONFIG_PATH}`);
    console.error("Copy test-mapping.example.json to test-mapping.json and adjust values.");
    process.exit(1);
  }

  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed.projectId || !Array.isArray(parsed.testCases) || parsed.testCases.length === 0) {
    console.error("[runner] Invalid config. Ensure projectId and non-empty testCases array are provided.");
    process.exit(1);
  }

  return parsed;
}

async function createRun(config) {
  const url = `${BASE_URL}/api/automation/runs`;
  const body = {
    projectId: config.projectId,
    environment: config.environment || "MAESTRO-STUDIO",
    testCaseIds: config.testCases.map((t) => t.testCaseId),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-automation-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create run: ${res.status} ${res.statusText} - ${text}`);
  }

  const json = await res.json();
  const testRunId = json.testRun?.id || json.id;
  console.log("[runner] Created TestRun", testRunId);
  return { testRunId };
}

function runMaestroFlow(flowPath) {
  return new Promise((resolve) => {
    console.log("[runner] Running Maestro flow:", flowPath);

    const child = spawn(MAESTRO_CLI, ["test", flowPath], {
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    child.on("close", (code) => {
      const success = code === 0;
      console.log(`[runner] Maestro exited with code ${code}`);
      resolve({ success, exitCode: code });
    });

    child.on("error", (err) => {
      console.error("[runner] Failed to start Maestro:", err.message);
      resolve({ success: false, exitCode: -1, error: err });
    });
  });
}

async function reportResult(config, skeleton, testCaseConfig, maestroResult) {
  const url = `${BASE_URL}/api/automation/results`;

  const expectedStatus = testCaseConfig.expectedStatus || "PASSED"; // for negative tests
  const actualStatus = maestroResult.success ? expectedStatus : expectedStatus === "PASSED" ? "FAILED" : "PASSED";

  const body = {
    projectId: config.projectId,
    testRunId: skeleton.testRunId,
    testCaseId: testCaseConfig.testCaseId,
    status: actualStatus,
    actualResult: maestroResult.success
      ? `Maestro completed. Expected: ${expectedStatus}. Exit code: ${maestroResult.exitCode}`
      : `Maestro failed. Expected: ${expectedStatus}. Exit code: ${maestroResult.exitCode}`,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-automation-key": API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[runner] Failed to report result:", res.status, res.statusText, text);
    return;
  }

  const json = await res.json();
  console.log("[runner] Reported result for", testCaseConfig.testCaseId, "->", json.status || json.result?.status);
}

async function main() {
  const config = readConfig();
  console.log("[runner] Loaded config for project", config.projectId);

  const skeleton = await createRun(config);

  for (const testCaseConfig of config.testCases) {
    console.log("\n[runner] === Running test case", testCaseConfig.testCaseId, "===");

    const maestroResult = await runMaestroFlow(testCaseConfig.flowPath);

    await reportResult(config, skeleton, testCaseConfig, maestroResult);
  }

  console.log("\n[runner] All test cases processed.");
}

main().catch((err) => {
  console.error("[runner] Fatal error:", err);
  process.exit(1);
});
