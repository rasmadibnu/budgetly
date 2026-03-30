import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getHouseholdContext } from "@/services/household-service";

export async function getHouseholdUsers() {
  const { householdId } = await getHouseholdContext();
  const supabase = await createSupabaseServerClient();
  const { data: members, error } = await supabase.from("household_members").select("user_id").eq("household_id", householdId);

  if (error) throw error;

  const userIds = members.map((member) => member.user_id);
  const { data: users, error: usersError } = await supabase.from("users").select("id, email, username, role").in("id", userIds);
  if (usersError) throw usersError;

  return users;
}
