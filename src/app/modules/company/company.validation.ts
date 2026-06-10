import { z } from 'zod';

const addDispatcherSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Invalid email' }),
  }),
});

const removeCompanySchema = z.object({
  params: z.object({
    companyId: z.string({ required_error: 'Company ID is required' }),
  }),
});

const updateJobStatusSchema = z.object({
  params: z.object({
    jobRequestId: z.string({ required_error: 'Job request ID is required' }),
  }),
  body: z.object({
    status: z.enum([
      'pending',
      'in-progress',
      'en-route',
      'working',
      'completed',
      'cancelled',
      'just',
      'picked-up',
      'dropped-off',
      'on-scene',
      'dispatched',
      'rejected',
    ]),
  }),
});

export const CompanyValidation = {
  addDispatcherSchema,
  removeCompanySchema,
  updateJobStatusSchema,
};
