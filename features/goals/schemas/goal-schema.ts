import { z } from "zod";

export const goalSchema = z.object({
  id: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  name: z.string().min(2).max(80),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0).default(0),
  startDate: z.string().min(1),
  targetDate: z.preprocess((value) => (value === "" ? null : value), z.string().nullable().optional()),
  status: z.enum(["active", "completed", "cancelled"]).default("active")
});

export type GoalInput = z.infer<typeof goalSchema>;
