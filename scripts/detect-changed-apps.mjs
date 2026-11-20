#!/usr/bin/env node

import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const outputFile = process.env.GITHUB_OUTPUT;
if (!outputFile) {
  throw new Error("GITHUB_OUTPUT is required");
}

const apps = ["user", "staff", "api"];
const appPaths = {
  user: "apps/user/",
  staff: "apps/staff/",
  api: "apps/api/",
};
const sharedPrefixes = [
  ".github/",
  ".editorconfig",
  "AGENTS.md",
  "README.md",
  "SETUP.md",
  "package.json",
  "package-lock.json",
  "scripts/",
];

const baseSha = process.env.PR_BASE_SHA?.trim();
const headSha = process.env.PR_HEAD_SHA?.trim();
let changedFiles = [];

if (baseSha && headSha && !/^0+$/.test(baseSha)) {
  changedFiles = execFileSync(
    "git",
    ["diff", "--name-only", baseSha, headSha],
    { encoding: "utf8" },
  )
    .split(/\r?\n/)
    .filter(Boolean);
} else {
  changedFiles = [...apps.map((app) => `${appPaths[app]}package.json`)];
}

const sharedChanged = changedFiles.some((file) =>
  sharedPrefixes.some(
    (prefix) =>
      file === prefix || (prefix.endsWith("/") && file.startsWith(prefix)),
  ),
);

for (const app of apps) {
  const changed =
    sharedChanged ||
    changedFiles.some((file) => file.startsWith(appPaths[app]));
  appendFileSync(outputFile, `${app}=${changed}\n`);
}
