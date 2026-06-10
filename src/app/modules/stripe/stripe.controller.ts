import { Request, Response } from "express";
import config from "../../../config";
import { stripe } from "./stripe.utils";
import { StripeCartService } from "./stripe.service";

import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";


// need for recharge
const stripeRechargeWebhook = async (req: Request, res: Response) => {
    try {
        const sig = req.headers['stripe-signature']!
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            config.stripe.stripe_webhook_secret!,
        );
        const result = await StripeCartService.stripeRechargeWebhook(event);
        res.send(result);
    } catch (err) {
        res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
};
const handleOnboardingStripeEvent = async (req: Request, res: Response) => {
    // eslint-disable-next-line no-console
    console.log("Received Stripe onboarding event:");
    try {
        const sig = req.headers['stripe-signature']!
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            config.stripe.STRIPE_ONBOARDING_SECRET!,
        );
        const result = await StripeCartService.handleOnboardingStripeEvent(event);
        res.send(result);
    } catch (err) {
        res.status(400).send(`Webhook Error: ${(err as Error).message}`);
    }
};


const createOrGetOnboardingStripe = catchAsync(async (req: Request, res: Response) => {
    const { userId, email } = req.user;
    // console.log("userId, email", userId, email);

    const result = await StripeCartService.createOrGetOnboardingStripe(userId, email);
    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: 'Stripe Payment method added successfully',
        data: result,
    });
});

export const StripeCartController = { stripeWebhook: stripeRechargeWebhook, createOrGetOnboardingStripe, handleOnboardingStripeEvent };