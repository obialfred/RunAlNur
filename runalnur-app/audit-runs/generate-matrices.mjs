import fs from "node:fs";
import path from "node:path";

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function walk(dir) {
  const out = [];
  if (!isDir(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (isDir(p)) out.push(...walk(p));
    else if (isFile(p)) out.push(p);
  }
  return out;
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function getLineMatches(lines, predicate) {
  const matches = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (predicate(line)) {
      matches.push({ line: i + 1, text: line.trimEnd() });
    }
  }
  return matches;
}

function extractMiddlewarePublicLists(middlewarePath) {
  const out = {
    publicRoutes: [],
    publicApiRoutes: [],
    hasDevApiBypass: false,
  };
  if (!isFile(middlewarePath)) return out;
  const text = readText(middlewarePath);
  out.hasDevApiBypass = /NODE_ENV\s*===\s*["']development["'][\s\S]*pathname\.startsWith\(["']\/api\//.test(
    text
  );

  const publicRoutesMatch = text.match(/const\s+PUBLIC_ROUTES\s*=\s*\[([\s\S]*?)\];/m);
  if (publicRoutesMatch?.[1]) {
    out.publicRoutes = publicRoutesMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .map((l) => {
        const m = l.match(/^["']([^"']+)["']/);
        return m?.[1] ?? null;
      })
      .filter((v) => typeof v === "string" && v.length > 0);
  }

  const publicApiMatch = text.match(/const\s+PUBLIC_API_ROUTES\s*=\s*\[([\s\S]*?)\];/m);
  if (publicApiMatch?.[1]) {
    out.publicApiRoutes = publicApiMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .map((l) => {
        const m = l.match(/^["']([^"']+)["']/);
        return m?.[1] ?? null;
      })
      .filter((v) => typeof v === "string" && v.length > 0);
  }

  return out;
}

function inferProviderFromPath(rel) {
  if (rel.includes("/clickup/")) return "clickup";
  if (rel.includes("/guru/")) return "guru";
  if (rel.includes("/hubspot/")) return "hubspot";
  if (rel.includes("/process-street/")) return "process-street";
  if (rel.includes("/ai/")) return "ai";
  if (rel.includes("/calendar/")) return "calendar";
  if (rel.includes("/notifications/")) return "notifications";
  if (rel.includes("/webhooks/")) return "webhooks";
  if (rel.includes("/cron/")) return "cron";
  return null;
}

function buildApiMatrix({ rootDir, outDir }) {
  const apiDir = path.join(rootDir, "app", "api");
  const middlewarePath = path.join(rootDir, "middleware.ts");
  const middleware = extractMiddlewarePublicLists(middlewarePath);

  const routeFiles = walk(apiDir).filter((p) => p.endsWith(path.sep + "route.ts"));

  const rows = routeFiles
    .map((abs) => {
      const rel = path.relative(rootDir, abs).replaceAll(path.sep, "/");
      const text = readText(abs);
      const methods = Array.from(text.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/g)).map(
        (m) => m[1]
      );

      const usesAuth =
        /getAuthenticatedUser\(|withAuth\(|unauthorizedResponse\(|forbiddenResponse\(/.test(text);
      const usesAdmin = /getSupabaseAdmin\(/.test(text);
      const usesDemo =
        /forceDemo\b|DEMO_MODE\b|NODE_ENV\s*===\s*["']development["']|demo-store|sampleProjects|sampleContacts|sampleTasks/.test(
          text
        );
      const provider = inferProviderFromPath(rel);
      const middlewarePublic = middleware.publicApiRoutes.some(
        (p) => rel.startsWith(p.replace(/^\//, "api/")) || rel === p.replace(/^\//, "api/")
      );

      const scopingSignals = [];
      for (const field of ["owner_id", "user_id", "arm_id", "tenant_id"]) {
        const re = new RegExp(`\\.eq\\(\\s*["']${field}["']`, "g");
        if (re.test(text)) scopingSignals.push(field);
      }

      const webhookSignals = getLineMatches(text.split("\n"), (l) => l.includes("verify") && l.includes("webhook"));

      return {
        route: "/" + rel.replace(/^app\//, "").replace(/\/route\.ts$/, "").replace(/^api\//, "api/"),
        file: rel,
        methods: Array.from(new Set(methods)),
        auth: {
          usesAuthHelpers: usesAuth,
          middlewarePublic,
          devApiBypassPresent: middleware.hasDevApiBypass,
        },
        dataAccess: {
          usesSupabaseAdmin: usesAdmin,
          scopingSignals,
        },
        behavior: {
          usesDemoFallbacks: usesDemo,
        },
        classification: {
          provider,
          isWebhook: rel.includes("/webhook/"),
          isCron: rel.includes("/cron/"),
        },
        notes: {
          webhookVerificationHints: webhookSignals.slice(0, 5),
        },
      };
    })
    .sort((a, b) => a.route.localeCompare(b.route));

  const doc = {
    generatedAt: new Date().toISOString(),
    root: rootDir,
    middleware: {
      publicApiRoutes: middleware.publicApiRoutes,
      publicRoutes: middleware.publicRoutes,
      devApiBypassPresent: middleware.hasDevApiBypass,
      file: path.relative(rootDir, middlewarePath).replaceAll(path.sep, "/"),
    },
    routes: rows,
  };

  const outPath = path.join(outDir, `${new Date().toISOString().slice(0, 10)}_api_matrix.json`);
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
  return outPath;
}

function buildUiInventory({ rootDir, outDir }) {
  const targets = [
    path.join(rootDir, "app"),
    path.join(rootDir, "components"),
  ];
  const files = targets.flatMap(walk).filter((p) => p.endsWith(".tsx"));

  const inventory = files
    .map((abs) => {
      const rel = path.relative(rootDir, abs).replaceAll(path.sep, "/");
      const lines = readText(abs).split("\n");

      const onClick = getLineMatches(lines, (l) => l.includes("onClick="));
      const fetchCalls = getLineMatches(lines, (l) => l.includes("fetch("));
      const routerPush = getLineMatches(lines, (l) => l.includes("router.push"));
      const hrefs = getLineMatches(lines, (l) => l.includes("href=") || l.includes("href={`") || l.includes("href={"));

      const hasAny = onClick.length || fetchCalls.length || routerPush.length || hrefs.length;
      if (!hasAny) return null;

      return {
        file: rel,
        actions: {
          onClick: onClick.slice(0, 200),
          fetch: fetchCalls.slice(0, 200),
          routerPush: routerPush.slice(0, 200),
          href: hrefs.slice(0, 200),
        },
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.file.localeCompare(b.file));

  const doc = {
    generatedAt: new Date().toISOString(),
    root: rootDir,
    files: inventory,
  };

  const outPath = path.join(outDir, `${new Date().toISOString().slice(0, 10)}_ui_inventory.json`);
  fs.writeFileSync(outPath, JSON.stringify(doc, null, 2) + "\n", "utf8");
  return outPath;
}

function main() {
  const rootDir = process.cwd();
  const outDir = path.join(rootDir, "audit-runs");
  if (!isDir(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const apiPath = buildApiMatrix({ rootDir, outDir });
  const uiPath = buildUiInventory({ rootDir, outDir });
  process.stdout.write(
    JSON.stringify(
      { ok: true, apiMatrix: path.relative(rootDir, apiPath), uiInventory: path.relative(rootDir, uiPath) },
      null,
      2
    ) + "\n"
  );
}

main();

