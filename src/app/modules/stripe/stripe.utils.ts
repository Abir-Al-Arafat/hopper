import Stripe from 'stripe';
import config from '../../../config';

const stripeSecret = config.stripe.stripe_api_secret;

if (!stripeSecret) {
  throw new Error(
    'Stripe secret is missing. Set STRIPE_API_SECRET or STRIPE_SECRET_KEY in .env',
  );
}

export const stripe = new Stripe(stripeSecret, {
  apiVersion: '2025-03-31.basil',
  typescript: true,
});
