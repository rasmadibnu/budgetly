"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { changePasswordSchema, type ChangePasswordInput } from "@/features/profile/schemas/change-password-schema";

export async function changePasswordAction(input: ChangePasswordInput) {
  const parsed = changePasswordSchema.parse(input);
  const user = await requireUser();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("change_budgetly_password", {
    target_user_id: user.id,
    current_password: parsed.currentPassword,
    new_password: parsed.newPassword
  });

  if (error) throw error;
  if (!data) {
    throw new Error("Current password is incorrect.");
  }

  revalidatePath("/profile");
  return { success: true };
}
