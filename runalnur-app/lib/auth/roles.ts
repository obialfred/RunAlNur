export type Role = "owner" | "operator" | "assistant" | "viewer";

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  operator: "Operator",
  assistant: "Assistant",
  viewer: "Viewer",
};

export const DEFAULT_ROLE: Role = "owner";
