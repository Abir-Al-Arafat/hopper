import { z } from 'zod';

const createCategoryValidationSchema = z.object({
  body: z.object({
    categoryName: z.string().min(3).max(255),
    parentage: z.number(),
  }),
});

export const CategoryValidation = {
  createCategoryValidationSchema,
};
