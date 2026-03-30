import { z } from "zod";

export const transactionSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive(),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().max(250).optional().nullable(),
  date: z.string().min(1),
  paymentMethod: z.string().max(50).optional().nullable(),
  attachmentUrl: z.string().url().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurrenceRule: z.enum(["monthly", "yearly", "one-time"]).nullable().optional()
});

export type TransactionInput = z.infer<typeof transactionSchema>;
