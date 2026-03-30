import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSession, SESSION_COOKIE_NAME } from "@/lib/session";
import type { Role } from "@/types/database";

export interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  role: Role;
}

export const requireUser = cache(async (): Promise<AuthenticatedUser> => {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const supabase = createSupabaseServerClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, username, role")
    .eq("id", session.sub)
    .single();

  if (error || !user) {
    cookies().delete(SESSION_COOKIE_NAME);
    redirect("/login");
  }

  return user;
});

export async function getCurrentHouseholdId() {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    throw new Error("Unable to resolve household membership.");
  }

  return data.household_id;
}
