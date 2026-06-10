import { z } from 'zod';

const faqSchema = z.object({
  title: z.string({ required_error: 'Title is required' }),
  content: z.string({ required_error: 'Content is required' }),
});

const contactUsSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  whatsapp: z.string().optional(),
});

const staticContentValidation = z.object({
  body: z.object({
    type: z.enum(['privacy-policy', 'terms-of-service', 'faq', 'contact-us']),

    content: z.string({ required_error: 'Content is required' }).optional(),

    faq: z.array(faqSchema).optional(),

    contactUs: contactUsSchema.optional(),
  }),
});

const updateStaticContentValidation = z.object({
  body: z.object({
    content: z.string().optional(),

    faq: z.array(faqSchema).optional(),

    contactUs: contactUsSchema.optional(),
  }),
});

export const StaticContentValidation = {
  staticContentValidation,
  updateStaticContentValidation,
};
