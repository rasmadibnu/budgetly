"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSignedSession, SESSION_COOKIE_NAME } from "@/lib/session";

const loginSchema = z.object({
  identifier: z.string().min(3),
  password: z.string().min(8)
});

export async function loginAction(_: unknown, formData: FormData) {
  const identifier = formData.get("identifier") ?? formData.get("email");
  const parsed = loginSchema.safeParse({
    identifier,
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: "Please enter a valid email or username and password.", success: false };
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("authenticate_budgetly_user", {
    login_identifier: parsed.data.identifier,
    plain_password: parsed.data.password
  });

  const user = Array.isArray(data) ? data[0] : data;

  if (error || !user) {
    return { error: "Invalid credentials.", success: false };
  }

  const session = await createSignedSession({
    sub: user.id,
    email: user.email,
    role: user.role
  });

  cookies().set(SESSION_COOKIE_NAME, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  revalidatePath("/", "layout");
  return { error: "", success: true };
}

export async function logoutAction() {
  cookies().delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
