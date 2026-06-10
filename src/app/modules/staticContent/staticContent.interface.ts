export type TType =
  | 'privacy-policy'
  | 'terms-of-service'
  | 'faq'
  | 'contact-us';

export type TFaq = {
  title: string;
  content: string;
};

export type TContactUs = {
  email?: string;
  phone?: string;
  address?: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
};

export type TStaticContent = {
  type: TType;
  content?: string;
  faq?: TFaq[];
  contactUs?: TContactUs;
  userId?: string;
};
