import config from '../../../config';
import { TAuthUser } from '../../interface/authUser';
import { stripe } from '../stripe/stripe.utils';
// import Stripe from 'stripe';
import { TSubscription } from '../subscription/subscription.interface';
import { TPayment } from './payment.interface';

export const calculateAmount = (amount: number) => {
  return Number(amount) * 100;
};

// const stripe = new Stripe(config.stripe.stripe_api_secret as string, {
//   apiVersion: '2025-03-31.basil',
//   typescript: true,
// });

export const createCheckoutSession = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paymentData: Partial<TPayment | TSubscription | any>,
  user: TAuthUser,
) => {
  const {
    jobRequestId,
    subscriptionId,
    userId,
    driverId,
    companyId,
    paymentType,
    amount,
    earnFrom,
    price,
  } = paymentData;

  let paymentGatewayData;
  if ((jobRequestId || subscriptionId) && (price || amount)) {
    paymentGatewayData = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${earnFrom} payment for ${user.name}`,
              description: `Payment from  ${earnFrom}`,
            },
            unit_amount: calculateAmount(amount || price),
          },
          quantity: 1,
        },
      ],

      success_url: `${config.base_url}/payment/confirm-payment?sessionId={CHECKOUT_SESSION_ID}&paymentType=${paymentType}&earnFrom=${earnFrom}&jobRequestId=${jobRequestId}&subscriptionId=${subscriptionId}&userId=${userId}&driverId=${driverId}&companyId=${companyId}&amount=${amount}&price=${price}`,

      cancel_url: `${config.base_url}/payments/cancel?paymentId=${'paymentDummy'}`,
      mode: 'payment',

      client_reference_id: `${earnFrom} payment`,
      invoice_creation: {
        enabled: true,
      },
    });
  } else {
    throw new Error('Payment data is not valid');
  }

  return paymentGatewayData.url;
};
