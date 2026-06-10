import { z } from 'zod';

const createSubscriptionValidationSchema = z.object({
  body: z.object({
    planName: z.string({ required_error: 'Name is required' }),
    price: z.number({ required_error: 'Price is required' }),
    timeline: z.number({ required_error: 'Timeline is required' }),
    features: z.array(z.string({ required_error: 'Features is required' })),
  }),
});

export const SubscriptionValidation = {
  createSubscriptionValidationSchema,
};
