import { z } from 'zod';

// Define the TLocation schema (assuming TLocation includes latitude and longitude)
const LocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.array(z.number()),
});

// Regex to validate ObjectId format (24-character hex string)
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Define the TJob validation schema
const jobValidationSchema = z.object({
  body: z.object({
    service: z
      .string()
      .regex(objectIdRegex, 'Service must be a valid ObjectId'),
    car: z
      .string()
      .regex(objectIdRegex, 'Car must be a valid ObjectId')
      .optional(),
    serviceName: z.string().min(1, 'Service name is required'),
    location: LocationSchema,
    dropOffLocation: LocationSchema.optional(), // Optional field
    extraService: z
      .array(
        z
          .string()
          .regex(objectIdRegex, 'Each extra service must be a valid ObjectId'),
      )
      .optional(),
    totalCost: z.number().min(0, 'Total cost must be a positive number'),
    signature: z.string().optional(),
    beforeImage: z.string().optional(),
    specialInstruction: z
      .string()
      .min(1, 'Special instruction is required')
      .optional(),
    houseAddress: z.string().min(1, 'House address is required').optional(),
    city: z.string().min(1, 'City is required').optional(),
    state: z.string().min(1, 'State is required').optional(),
    zipCode: z.number().optional(),
    afterImage: z.string().optional(),
  }),
});

export const JobValidation = {
  jobValidationSchema,
};
