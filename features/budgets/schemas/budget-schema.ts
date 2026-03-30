import { z } from "zod";

export const budgetSchema = z.object({
  id: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  categoryId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.coerce.number().positive()
});

export type BudgetInput = z.infer<typeof budgetSchema>;
