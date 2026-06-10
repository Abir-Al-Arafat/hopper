import { z } from 'zod';

const reviewValidationSchema = z.object({
  body: z.object({
    rating: z.number({ required_error: 'Rating is required' }),
    driverId: z.string({ required_error: 'Driver ID is required' }),
    serviceId: z.string({ required_error: 'Service ID is required' }),
  }),
});

export const ReviewValidation = {
  reviewValidationSchema,
};
