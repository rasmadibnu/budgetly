import { z } from "zod";

export const investmentSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  platform: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currentValue: z.coerce.number().min(0, "Current value must be zero or greater"),
  startedAt: z.string().min(1, "Start date is required"),
  status: z.enum(["active", "closed"]),
  notes: z.string().optional()
});

export type InvestmentInput = z.infer<typeof investmentSchema>;
