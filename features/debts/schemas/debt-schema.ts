import { z } from "zod";

export const debtBaseSchema = z.object({
  id: z.string().uuid().optional(),
  direction: z.enum(["debt", "receivable"]),
  name: z.string().min(1, "Name is required"),
  counterparty: z.string().min(1, "Counterparty is required"),
  totalAmount: z.coerce.number().positive("Amount must be greater than zero"),
  paidAmount: z.coerce.number().min(0, "Paid amount must be zero or greater"),
  dueDate: z.string().optional(),
  status: z.enum(["open", "settled"]),
  notes: z.string().optional()
});

export const debtSchema = debtBaseSchema.refine((value) => value.paidAmount <= value.totalAmount, {
  message: "Paid amount cannot exceed total amount",
  path: ["paidAmount"]
});

export type DebtInput = z.infer<typeof debtSchema>;
