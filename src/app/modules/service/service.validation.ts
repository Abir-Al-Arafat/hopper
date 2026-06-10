import { z } from 'zod';

const createServiceValidationSchema = z.object({
  body: z.object({
    category: z.string(),
    serviceName: z.string(),
    description: z.string(),
    price: z.number().positive(),
    milageFee: z.number().positive(),
    totalFee: z.number().positive(),
  }),
});

export const ServiceValidation = {
  createServiceValidationSchema,
};
