#!/usr/bin/env node
/**
 * Packages the Windows installer, starting from nothing but a fresh clone.
 *
 * Two files the build depends on are deliberately untracked: `.env` (may point
 * at a real database) and `prisma/prod.db` (may contain client data). A clone
 * therefore has neither, and both `next build` and electron-builder's
 * `extraResources` need them — historically that produced an installer with no
 * usable database, which surfaces as "Internal Server Error" on first launch,
 * because Prisma ends up opening an empty file that has no tables in it.
 *
 * This script supplies both itself, so `npm run electron:build` works on a
 * machine that has only ever run `npm install`.
 *
 * Pass --template-only to build just prisma/prod.db and stop.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const templateOnly = process.argv.includes("--template-only");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templateDb = path.join(root, "prisma", "prod.db");

// Prisma resolves a relative `file:` URL from the schema's directory, not the
// project root, so the template one directory down is "./prod.db".
const env = { ...process.env, DATABASE_URL: process.env.DATABASE_URL ?? "file:./prod.db" };

function run(command, args) {
  console.log(`
> ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: root,
    env,
    stdio: "inherit",
    // npx resolves through a shim on Windows.
    shell: process.platform === "win32",
  });
}

// The generated client has to exist before the seed script imports it, and
// electron-builder copies node_modules/.prisma into the package.
run("npx", ["prisma", "generate"]);

if (existsSync(templateDb)) {
  console.log("prisma/prod.db found — using it as the first-run template.");
} else {
  console.log("prisma/prod.db missing — building the first-run template.");
  run("npx", ["prisma", "db", "push", "--skip-generate"]);
  run("npx", ["tsx", "prisma/seed.ts"]);
}

if (templateOnly) {
  console.log("Template ready at prisma/prod.db.");
  process.exit(0);
}

run("npx", ["next", "build"]);
run("npx", ["electron-builder"]);

console.log("Done. The installer is in dist/.");
