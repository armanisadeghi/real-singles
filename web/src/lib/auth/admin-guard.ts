import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type UserRole = "user" | "admin" | "moderator";

interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Get the current authenticated user with their role
 * Returns null if not authenticated
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }

  // Get user role from users table
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email || "",
    role: (userData?.role as UserRole) || "user",
  };
}

/**
 * Require admin role - redirects to login if not admin
 * Use in Server Components or route handlers
 */
export async function requireAdmin(): Promise<AuthUser> {
  const user = await getAuthUser();
  
  if (!user) {
    redirect("/admin/login");
  }
  
  if (user.role !== "admin" && user.role !== "moderator") {
    redirect("/admin/unauthorized");
  }
  
  return user;
}

/**
 * Require specific role(s)
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const user = await getAuthUser();
  
  if (!user) {
    redirect("/admin/login");
  }
  
  if (!allowedRoles.includes(user.role)) {
    redirect("/admin/unauthorized");
  }
  
  return user;
}

/**
 * Check if user is admin (for API routes)
 * Returns user or null
 */
export async function checkAdmin(): Promise<AuthUser | null> {
  const user = await getAuthUser();
  
  if (!user || (user.role !== "admin" && user.role !== "moderator")) {
    return null;
  }
  
  return user;
}
