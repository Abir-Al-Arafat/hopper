import { z } from 'zod';
const updateProfileSchema = z.object({
  body: z.object({
    address: z
      .string({
        invalid_type_error: 'address must be a string',
      })
      .min(3)
      .max(50)
      .optional(),
    activity: z.enum(['available', 'offline', 'on-job']).optional(),

    addressLineTwo: z
      .string({
        invalid_type_error: 'addressLineTwo must be a string',
      })
      .min(3)
      .max(50)
      .optional(),

    facebook: z
      .string({
        invalid_type_error: 'Facebook URL must be a string',
      })
      .min(3)
      .max(50)
      .optional(),

    instagram: z
      .string({
        invalid_type_error: 'Instagram URL must be a string',
      })
      .min(3)
      .max(50)
      .optional(),

    houseAddress: z
      .string({
        invalid_type_error: 'houseAddress must be a number',
      })
      .min(3)
      .max(50)
      .optional(),

    city: z
      .string({
        invalid_type_error: 'city must be a string',
      })
      .min(3)
      .max(50)
      .optional(),

    state: z
      .string({
        invalid_type_error: 'state must be a string',
      })
      .min(3)
      .max(50)
      .optional(),

    zipCode: z
      .string({
        invalid_type_error: 'zipCode must be a string',
      })
      .min(3)
      .max(50)
      .optional(),

    gender: z
      .enum(['male', 'female', 'others'], {
        errorMap: () => {
          return { message: 'gender must be male, female or others' };
        },
      })
      .optional(),
  }),
});

export const ProfileValidation = {
  updateProfileSchema,
};
