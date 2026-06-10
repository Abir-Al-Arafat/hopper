import { Types } from "mongoose";

export interface IWallet extends Document {
    userId: Types.ObjectId;
    onboardingCompleted: boolean;
    stripeAccountId: string | null;
}