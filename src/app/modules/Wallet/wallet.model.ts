
import { Schema, model } from 'mongoose';
import { IWallet } from './wallet.interface';



const walletSchema = new Schema<IWallet>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        onboardingCompleted: { type: Boolean, default: false },
        stripeAccountId: { type: String, default: null },
    },
    { timestamps: true }
);
walletSchema.index({ userId: 1 }, { unique: true });
const Wallet = model<IWallet>('Wallet', walletSchema);
export default Wallet;


const withdrawalSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        amount: { type: Number, required: true },
        payoutId: { type: String, required: true },

    },
    { timestamps: true }
);

export const Withdrawal = model('Withdrawal', withdrawalSchema);







