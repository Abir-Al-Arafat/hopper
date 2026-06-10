import { z } from 'zod';

const paymentValidation = z.object({
  body: z.object({
    amount: z.string({ required_error: 'Amount is required' }).optional(),
    jobRequestId: z
      .string({ required_error: 'Order id is required' })
      .optional(),
    subscriptionId: z
      .string({ required_error: 'Subscription id is required' })
      .optional(),
    driverId: z
      .string({ required_error: 'driverId id is required' })
      .optional(),
    paymentType: z.enum(['card', 'cash', 'bank', 'paypal'], {
      required_error: 'Payment type is required',
    }),
    earnFrom: z.enum(['job', 'subscription'], {
      required_error: 'Payment type is required',
    }),
  }),
});

export const PaymentValidation = {
  paymentValidation,
};
