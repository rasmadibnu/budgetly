import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Confirm password is required")
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "Password confirmation does not match",
  path: ["confirmPassword"]
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
