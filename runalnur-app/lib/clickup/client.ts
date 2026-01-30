import { ClickUpClient, getClickUpClient } from "@/lib/integrations/clickup";
import { getOAuthAccessToken } from "@/lib/integrations/user-credentials";

export async function getClickUpClientForUser(
  tenantId: string,
  userId: string
): Promise<{ client: ClickUpClient; mode: "oauth" | "env" } | null> {
  const accessToken = await getOAuthAccessToken(tenantId, userId, "clickup");
  if (accessToken) {
    return { client: new ClickUpClient({ apiKey: accessToken }), mode: "oauth" };
  }

  // Env fallback is DEMO_MODE only (never in production).
  if (process.env.DEMO_MODE === "true") {
    const envClient = getClickUpClient();
    if (envClient) return { client: envClient, mode: "env" };
  }
  return null;
}

