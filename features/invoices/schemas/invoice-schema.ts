import { z } from "zod";

export const invoiceSchema = z.object({
  id: z.preprocess((value) => (value === "" ? undefined : value), z.string().uuid().optional()),
  name: z.string().min(2).max(80),
  clientName: z.string().min(2).max(80),
  amount: z.coerce.number().positive(),
  issuedDate: z.string().min(1),
  dueDate: z.string().min(1),
  status: z.enum(["paid", "unpaid"]).default("unpaid"),
  notes: z.preprocess((value) => (value === "" ? null : value), z.string().max(500).optional().nullable())
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
