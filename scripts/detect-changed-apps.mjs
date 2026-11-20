#!/usr/bin/env node

import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

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

const baseSha = process.env.BASE_SHA?.trim();
const headSha = process.env.HEAD_SHA?.trim();
const allChanged = process.env.ALL_CHANGED === "true";
let changedFiles = [];

if (allChanged) {
  changedFiles = [...apps.map((app) => `${appPaths[app]}package.json`)];
} else if (baseSha && headSha && !/^0+$/.test(baseSha)) {
  changedFiles = execFileSync(
    "git",
    ["diff", "--name-only", baseSha, headSha],
    { encoding: "utf8" },
  )
    .split(/\r?\n/)
    .filter(Boolean);
} else {
  throw new Error("BASE_SHA and HEAD_SHA are required unless ALL_CHANGED=true");
}

const sharedChanged = changedFiles.some((file) =>
  sharedPrefixes.some(
    (prefix) =>
      file === prefix || (prefix.endsWith("/") && file.startsWith(prefix)),
  ),
);

const results = Object.fromEntries(
  apps.map((app) => {
    const changed =
      sharedChanged ||
      changedFiles.some((file) => file.startsWith(appPaths[app]));
    return [app, changed];
  }),
);

const outputFile = process.env.GITHUB_OUTPUT;
if (outputFile) {
  for (const app of apps) {
    appendFileSync(outputFile, `${app}=${results[app]}\n`);
  }
} else {
  console.log(JSON.stringify({ changedFiles, apps: results }, null, 2));
}
