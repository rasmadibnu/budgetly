import { cache } from "react";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types/app";

export interface HouseholdContext {
  householdId: string;
  user: {
    id: string;
    email: string;
    username: string;
  };
  profile: UserProfile;
}

export const getHouseholdContext = cache(async (): Promise<HouseholdContext> => {
  const user = await requireUser();
  const supabase = createSupabaseServerClient();

  const [{ data: membership, error: membershipError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("household_members").select("household_id").eq("user_id", user.id).single(),
    supabase.from("users").select("id, email, username, role").eq("id", user.id).single()
  ]);

  if (membershipError || !membership) {
    throw new Error("Household membership not found.");
  }

  if (profileError || !profile) {
    throw new Error("User profile not found.");
  }

  return {
    householdId: membership.household_id,
    user: {
      id: user.id,
      email: profile.email,
      username: profile.username
    },
    profile
  };
});
