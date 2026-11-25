#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const optional = (name) => process.env[name]?.trim() || undefined;
const required = (name) => {
  const value = optional(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const environment = optional("DEPLOY_ENVIRONMENT") ?? "production";
const knownEnvironments = ["production", "development", "preview"];
if (!knownEnvironments.includes(environment)) {
  throw new Error(`Unsupported DEPLOY_ENVIRONMENT: ${environment}`);
}
const isProduction = environment === "production";
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
const d1DatabaseName = needsApi ? required("D1_DATABASE_NAME") : undefined;
const d1DatabaseId = needsApi ? required("D1_DATABASE_ID") : undefined;
const r2BucketName = needsApi ? required("R2_BUCKET_NAME") : undefined;
const resendFromEmail = needsApi ? required("RESEND_FROM_EMAIL") : undefined;

const pagesOrigin = (project) =>
  isProduction
    ? `https://${project}.pages.dev`
    : `https://*.${project}.pages.dev,https://${project}.pages.dev`;
const developerOrigins = ["http://localhost:3030", "http://localhost:3040"];

const userPagesProject =
  needsUser || needsApi ? required("USER_PAGES_PROJECT") : undefined;
const staffPagesProject =
  needsStaff || needsApi ? required("STAFF_PAGES_PROJECT") : undefined;
const corsOrigin = needsApi
  ? [
      pagesOrigin(userPagesProject),
      pagesOrigin(staffPagesProject),
      ...developerOrigins,
    ].join(",")
  : undefined;

// All environments get a public workers.dev URL so the API can be tested
// directly. The URLs are placed behind Cloudflare Access (see SETUP.md).
const apiBindings = {
  vars: {
    ENVIRONMENT: environment,
    CORS_ORIGIN: corsOrigin,
    RESEND_FROM_EMAIL: resendFromEmail,
  },
  d1_databases: [
    {
      binding: "DB",
      database_name: d1DatabaseName,
      database_id: d1DatabaseId,
      migrations_dir: "d1/migrations",
    },
  ],
  r2_buckets: [
    {
      binding: "IMAGES",
      bucket_name: r2BucketName,
    },
  ],
  triggers: {
    crons: isProduction ? ["0 15 * * *"] : [],
  },
};
const apiCommon = {
  $schema: "node_modules/wrangler/config-schema.json",
  name: apiServiceName,
  workers_dev: true,
  main: "src/worker.ts",
  compatibility_date: optional("COMPATIBILITY_DATE") ?? "2025-11-01",
  compatibility_flags: ["nodejs_compat"],
  observability: { enabled: true },
  dev: { port: 3080 },
};
// A single Worker is deployed for all environments. The selected environment's
// bindings are written to the top level, so the code never branches by host.
const wranglerConfig = needsApi ? { ...apiCommon, ...apiBindings } : undefined;

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
