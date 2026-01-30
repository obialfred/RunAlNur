import type { Role } from "@/lib/auth/roles";

export type Permission =
  | "projects.read"
  | "projects.write"
  | "tasks.write"
  | "contacts.write"
  | "sops.execute"
  | "ai.execute"
  | "approvals.manage"
  | "admin";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ["admin", "projects.read", "projects.write", "tasks.write", "contacts.write", "sops.execute", "ai.execute", "approvals.manage"],
  operator: ["projects.read", "projects.write", "tasks.write", "contacts.write", "sops.execute", "ai.execute"],
  assistant: ["projects.read", "tasks.write", "contacts.write"],
  viewer: ["projects.read"],
};

export function hasPermission(role: Role, permission: Permission) {
  const perms = ROLE_PERMISSIONS[role] || [];
  return perms.includes("admin") || perms.includes(permission);
}
