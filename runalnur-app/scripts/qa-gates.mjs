import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(process.cwd(), "..");
const appRoot = path.resolve(process.cwd());

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function exists(relFromAppRoot) {
  return fs.existsSync(path.resolve(appRoot, relFromAppRoot));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function section(title) {
  console.log(`\n== ${title} ==`);
}

function ok(msg) {
  console.log(`OK: ${msg}`);
}

function warn(msg) {
  console.warn(`WARN: ${msg}`);
}

function fail(msg) {
  console.error(`FAIL: ${msg}`);
  process.exitCode = 1;
}

function readText(relPath) {
  return fs.readFileSync(path.resolve(appRoot, relPath), "utf8");
}

function listFiles(dirRel, acc = []) {
  const dirAbs = path.resolve(appRoot, dirRel);
  for (const entry of fs.readdirSync(dirAbs, { withFileTypes: true })) {
    const rel = path.join(dirRel, entry.name);
    if (entry.isDirectory()) listFiles(rel, acc);
    else acc.push(rel);
  }
  return acc;
}

function grepInFiles(filesRel, pattern) {
  const hits = [];
  for (const f of filesRel) {
    const text = readText(f);
    if (pattern.test(text)) hits.push(f);
  }
  return hits;
}

try {
  section("Gate 0 (static): manifest/icons");
  const manifest = readJson(path.resolve(appRoot, "public/manifest.json"));
  assert(Array.isArray(manifest.icons), "manifest.icons missing/invalid");
  const missing = [];
  for (const icon of manifest.icons) {
    if (!icon?.src) continue;
    const rel = icon.src.replace(/^\//, "public/");
    if (!exists(rel)) missing.push(icon.src);
  }
  if (missing.length) fail(`Missing manifest icon files: ${missing.join(", ")}`);
  else ok(`All manifest icons exist (${manifest.icons.length})`);
  ok(`manifest theme_color=${manifest.theme_color} background_color=${manifest.background_color}`);

  section("Gate 4 (static): viewport/safe-area baseline");
  const layout = readText("app/layout.tsx");
  if (!layout.includes('viewportFit: "cover"')) warn("layout viewportFit: cover not found");
  if (!layout.includes('interactiveWidget: "resizes-content"')) warn("layout interactiveWidget not found");
  else ok("layout viewport includes interactiveWidget + viewportFit");

  const globals = readText("app/globals.css");
  if (!globals.includes("--sat: env(safe-area-inset-top")) warn("globals.css safe-area vars not found");
  else ok("globals.css defines safe-area vars");

  const shell = readText("components/layout/LayoutShell.tsx");
  if (!shell.includes("var(--app-height")) warn("LayoutShell not using --app-height (mobile 100vh fix)");
  else ok("LayoutShell uses --app-height for mobile viewport height");

  section("Gate 1/3 (static): demo fallbacks behind DEMO_MODE");
  const apiFiles = listFiles("app/api").filter((p) => p.endsWith(".ts"));
  const nodeEnvHits = grepInFiles(apiFiles, /process\.env\.NODE_ENV\s*===\s*["']development["']/);
  if (nodeEnvHits.length) {
    warn(`Found NODE_ENV===development usage in API routes (${nodeEnvHits.length} files). This is allowed for debug-only; demo fallbacks should use DEMO_MODE.`);
    for (const f of nodeEnvHits.slice(0, 20)) console.log(` - ${f}`);
    if (nodeEnvHits.length > 20) console.log(` - ... +${nodeEnvHits.length - 20} more`);
  } else {
    ok("No NODE_ENV===development checks inside app/api");
  }

  const demoModeMissingGate = grepInFiles(apiFiles, /(!supabase\s*\|\|\s*forceDemo)|forceDemo/);
  if (demoModeMissingGate.length) {
    fail(`Found legacy forceDemo patterns in API routes: ${demoModeMissingGate.join(", ")}`);
  } else {
    ok("No legacy forceDemo patterns in app/api");
  }

  section("Gate 1 (static): middleware bypass checks");
  const middleware = readText("middleware.ts");
  if (/NODE_ENV\s*===\s*["']development["']/.test(middleware) && /Supabase not configured/.test(middleware)) {
    fail("middleware.ts appears to allow a NODE_ENV=development auth bypass when Supabase is not configured (should be DEMO_MODE-gated).");
  } else {
    ok("middleware.ts does not include Supabase-not-configured dev bypass");
  }
  if (!/DEMO_MODE\s*===\s*["']true["']/.test(middleware)) {
    warn("middleware.ts does not mention DEMO_MODE; ensure demo behavior is explicitly gated where intended.");
  } else {
    ok("middleware.ts references DEMO_MODE gating");
  }

  section("Repo note");
  console.log(`repoRoot=${repoRoot}`);
  console.log(`appRoot=${appRoot}`);

  if (!process.exitCode) {
    console.log("\nAll static QA checks passed.");
  } else {
    console.log("\nStatic QA checks completed with failures.");
  }
} catch (e) {
  fail(e instanceof Error ? e.message : String(e));
}

