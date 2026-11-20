#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const required = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const optional = (name) => process.env[name]?.trim() || undefined;

const pagesBranch = required("PAGES_BRANCH");
const isProduction = pagesBranch === "main";
const appEnvironment = isProduction ? "production" : "development";
const targets = new Set(
  (optional("CONFIG_TARGETS") ?? "api,user,staff")
    .split(",")
    .map((target) => target.trim())
    .filter(Boolean),
);
const needsApi = targets.has("api");
const needsUser = targets.has("user");
const needsStaff = targets.has("staff");
const apiOutputPath = resolve(
  optional("WRANGLER_OUTPUT") ?? "apps/api/wrangler.generated.jsonc",
);
const userOutputPath = resolve(
  optional("USER_WRANGLER_OUTPUT") ?? "apps/user/wrangler.generated.toml",
);
const staffOutputPath = resolve(
  optional("STAFF_WRANGLER_OUTPUT") ?? "apps/staff/wrangler.generated.toml",
);
const apiServiceName = required("API_SERVICE_NAME");

const pagesOrigin = (project) =>
  isProduction
    ? `https://${project}.pages.dev`
    : `https://*.${project}.pages.dev,https://${project}.pages.dev`;

const userPagesProject =
  needsUser || needsApi ? required("USER_PAGES_PROJECT") : undefined;
const staffPagesProject =
  needsStaff || needsApi ? required("STAFF_PAGES_PROJECT") : undefined;
const corsOrigin = needsApi
  ? [pagesOrigin(userPagesProject), pagesOrigin(staffPagesProject)].join(",")
  : undefined;

const wranglerConfig = needsApi
  ? {
      $schema: "node_modules/wrangler/config-schema.json",
      name: apiServiceName,
      workers_dev: false,
      main: "src/worker.ts",
      compatibility_date: optional("COMPATIBILITY_DATE") ?? "2025-11-01",
      compatibility_flags: ["nodejs_compat"],
      observability: { enabled: true },
      dev: { port: 3080 },
      vars: {
        ENVIRONMENT: optional("APP_ENVIRONMENT") ?? appEnvironment,
        CORS_ORIGIN: corsOrigin,
        RESEND_FROM_EMAIL: required("RESEND_FROM_EMAIL"),
      },
      d1_databases: [
        {
          binding: "DB",
          database_name: required("D1_DATABASE_NAME"),
          database_id: required("D1_DATABASE_ID"),
          migrations_dir: "d1/migrations",
        },
      ],
      r2_buckets: [
        {
          binding: "IMAGES",
          bucket_name: required("R2_BUCKET_NAME"),
        },
      ],
      triggers: {
        crons: isProduction ? ["0 15 * * *"] : [],
      },
    }
  : undefined;

const pagesConfig = (name) =>
  `name = "${name}"\n` +
  `compatibility_date = "${optional("COMPATIBILITY_DATE") ?? "2025-11-01"}"\n` +
  'pages_build_output_dir = "build/client"\n\n' +
  "[[services]]\n" +
  'binding = "API"\n' +
  `service = "${apiServiceName}"\n`;

const outputs = [
  needsApi && [apiOutputPath, `${JSON.stringify(wranglerConfig, null, 2)}\n`],
  needsUser && [userOutputPath, pagesConfig(userPagesProject)],
  needsStaff && [staffOutputPath, pagesConfig(staffPagesProject)],
].filter(Boolean);

for (const [path, contents] of outputs) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
  console.log(`Generated ${relative(process.cwd(), path)}`);
}
