/* eslint-disable @typescript-eslint/no-explicit-any */
import Stripe from "stripe";

import { stripe } from "./stripe.utils";
import httpStatus from "http-status";
import Wallet from "../Wallet/wallet.model";
import User from "../user/user.model";
import AppError from "../../utils/AppError";



const createOrGetOnboardingStripe = async (userId: string, userEmail: string) => {
    console.log("createOrGetOnboardingStripe called with userId:", userId, "and email:", userEmail);
    let paymentMethod = await Wallet.findOne({ userId });
    if (paymentMethod && paymentMethod.stripeAccountId) {
        // Check onboarding
        if (!paymentMethod.onboardingCompleted) {
            const accountLink = await stripe.accountLinks.create({
                account: paymentMethod.stripeAccountId,
                refresh_url: "https://hopper.com/success/onboarding",
                return_url: "https://hopper.com/return/onboarding",
                type: "account_onboarding",
            });

            return { stripeAccountId: paymentMethod.stripeAccountId, onboardingLink: accountLink.url };
        }

        return { stripeAccountId: paymentMethod.stripeAccountId, onboardingCompleted: paymentMethod.onboardingCompleted };
    }
    if (!userEmail) {
        throw new Error('Email is required to create Stripe account');
    }
    // Create new Stripe account
    const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: userEmail,
        capabilities: {
            transfers: { requested: true },
            card_payments: { requested: true },
        },
        // settings: {
        //     payouts: {
        //         schedule: {
        //             interval: 'daily',
        //         }
        //     }
        // }
    });

    if (!paymentMethod) {
        paymentMethod = new Wallet({
            userId,
            stripeAccountId: account.id,
            onboardingCompleted: false,
            // status: 'pending',
        });
    } else {
        paymentMethod.stripeAccountId = account.id;
        paymentMethod.onboardingCompleted = false;
        // paymentMethod.status = 'pending';
    }

    await paymentMethod.save();

    const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: "https://hopper.com/refresh/onboarding",
        return_url: "https://hopper.com/return/onboarding",
        type: "account_onboarding",
    });

    return { stripeAccountId: account.id, onboardingLink: accountLink.url };
}

const createWalletRechargeLink = async (
    userId: string,
    amount: number
) => {
    if (!amount || amount <= 0) {
        throw new AppError(httpStatus.BAD_REQUEST, 'Invalid recharge amount');
    }

    // optional: min/max
    if (amount < 5) {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            'Recharge amount minimum is $5'
        );
    }

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],

        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: 'Wallet Recharge',
                    },
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            },
        ],

        metadata: {
            userId,
            paymentMode: 'WALLET_RECHARGE',
            amount: amount.toString(),
        },

        success_url: `https://hopper.com`,
        cancel_url: `https://hopper.com`,
    });
    return session.url;
};

const stripeRechargeWebhook = async (event: any) => {

    if (event.type !== 'checkout.session.completed') return;

    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.paymentMode !== 'WALLET_RECHARGE') return;

    const userId = session.metadata.userId;
    const amount = Number(session.metadata.amount); // dollar
    const userData = await User.findOne({ _id: userId });
    if (!userData) return;
    return amount
};
const handleOnboardingStripeEvent = async (event: any) => {
// eslint-disable-next-line no-console
console.log("Received Stripe event:", event.type);
    if (event.type === "account.updated") {
        const account = event.data.object as Stripe.Account;
        if (account.charges_enabled && account.details_submitted) {
            // mark onboarding completed
            await Wallet.findOneAndUpdate(
                { stripeAccountId: account.id },
                { onboardingCompleted: true, status: "active" }
            );
            // await stripe.accounts.update(account.id, {
            //     settings: {
            //         payouts: {
            //             schedule: { interval: "daily" }
            //         }
            //     }
            // });
        }
    }

    return
};





export const StripeCartService = { createOrGetOnboardingStripe, createWalletRechargeLink, stripeRechargeWebhook, handleOnboardingStripeEvent };