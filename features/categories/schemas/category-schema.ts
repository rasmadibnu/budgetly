import { z } from "zod";

export const categorySchema = z.object({
  id: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  name: z.string().min(2).max(50),
  type: z.enum(["income", "expense"]),
  color: z.string().min(4).max(20),
  reportGroup: z.enum(["primary", "secondary", "tersier"]).default("secondary"),
  icon: z.string().nullable().optional()
});

export type CategoryInput = z.infer<typeof categorySchema>;
