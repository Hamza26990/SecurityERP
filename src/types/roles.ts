export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  SUPERVISOR = "supervisor",
  HR = "hr",
  FINANCE = "finance",
  SECURITY_GUARD = "security_guard",
  CLIENT = "client",
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: "Super Admin",
  [UserRole.ADMIN]: "Admin",
  [UserRole.SUPERVISOR]: "Supervisor",
  [UserRole.HR]: "HR",
  [UserRole.FINANCE]: "Finance",
  [UserRole.SECURITY_GUARD]: "Security Guard",
  [UserRole.CLIENT]: "Client",
};
