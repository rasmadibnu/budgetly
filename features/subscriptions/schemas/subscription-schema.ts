import { z } from "zod";

export const subscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Name is required"),
  vendor: z.string().min(1, "Vendor is required"),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  billingDay: z.coerce.number().int().min(1).max(28),
  categoryId: z.string().optional(),
  paymentMethod: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  status: z.enum(["active", "paused", "cancelled"]),
  notes: z.string().optional()
});

export type SubscriptionInput = z.infer<typeof subscriptionSchema>;
