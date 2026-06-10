import { model, Schema } from 'mongoose';
import { TFaq, TStaticContent, TContactUs } from './staticContent.interface';

const faqSchema = new Schema<TFaq>({
  title: { type: String, required: true },
  content: { type: String, required: true },
});

const contactUsSchema = new Schema<TContactUs>(
  {
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    facebook: { type: String },
    instagram: { type: String },
    whatsapp: { type: String },
  },
  {
    _id: false,
  },
);

const staticContentSchema = new Schema<TStaticContent>(
  {
    type: {
      type: String,
      enum: ['privacy-policy', 'terms-of-service', 'faq', 'contact-us'],
      required: true,
    },

    content: {
      type: String,
    },

    faq: {
      type: [faqSchema],
    },

    contactUs: {
      type: contactUsSchema,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
);

const StaticContent = model<TStaticContent>(
  'StaticContent',
  staticContentSchema,
);

export default StaticContent;
