import Wallet, { Withdrawal } from "./wallet.model"
import httpStatus from "http-status"
import AppError from "../../utils/AppError"
import { stripe } from "../stripe/stripe.utils"
import QueryBuilder from "../../QueryBuilder/queryBuilder"
const walletCreate = async (userId: string) => {
  const findWallet = await Wallet.findOne({ userId })
  if (findWallet) {
    return findWallet
  }
  const wallet = await Wallet.create({ userId })
  if (!wallet) {
    throw new AppError(httpStatus.BAD_REQUEST, "Wallet not created")
  }
  return wallet
}
const getWalletWithBalance = async (userId: string) => {
  const wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Wallet not found');
  }

  if (!wallet.stripeAccountId) {
    return {
      ...wallet.toObject(),
      balance: 0,
      currency: 'usd',
    };
  }

  // 🔥 Fetch balance from Stripe connected account
  const balance = await stripe.balance.retrieve({
    stripeAccount: wallet.stripeAccountId,
  });

  // Available balance (withdrawable)
  const availableBalance = balance.available.reduce(
    (acc, item) => acc + item.amount,
    0,
  );

  // Pending balance
  const pendingBalance = balance.pending.reduce(
    (acc, item) => acc + item.amount,
    0,
  );

  return {
    ...wallet.toObject(),
    balance: availableBalance / 100, // convert from cents
    pendingBalance: pendingBalance / 100,
    currency: balance.available[0]?.currency || 'usd',
  };
};

const initiatePayout = async (userId: string, amount: number) => {
  if (amount < 0) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Minimum payout amount is $10');
  }

  const wallet = await Wallet.findOne({ userId });

  if (!wallet || !wallet.stripeAccountId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Wallet or Stripe account not found');
  }

  // 👉 1. Stripe balance check (connected account)
  const balance = await stripe.balance.retrieve({
    stripeAccount: wallet.stripeAccountId,
  });

  const availableBalanceCents = balance.available.reduce(
    (acc, item) => acc + item.amount,
    0
  );

  if (availableBalanceCents < amount * 100) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Insufficient balance for payout'
    );
  }

  // 👉 2. Create payout (bank transfer)
  const payout = await stripe.payouts.create(
    {
      amount: amount * 100, // cents
      currency: 'usd',
    },
    {
      stripeAccount: wallet.stripeAccountId, // VERY IMPORTANT
    }
  );

  //   // 👉 3. (optional but recommended) save payout log
  await Withdrawal.create({
    userId,
    amount,
    payoutId: payout.id,
  });

  return {
    message: 'Payout initiated successfully',
    payoutId: payout.id,
    // status: payout.status,
  };
};
const getPayoutHistory = async (
  userId: string,
  query: Record<string, unknown>,
) => {
  // Base condition: filter by userId
  const condition = {
    userId,
  };

  // Initialize query builder
  const queryBuilder = new QueryBuilder(
    Withdrawal.find(condition),
    query,
  );

  // Apply sorting & pagination
  const result = await queryBuilder
    .sort()
    .paginate().queryModel;

  // Get meta data
  const meta = await queryBuilder.countTotal();

  return {
    meta,
    result,
  };
};
export const walletService = {
  walletCreate,
  getWalletWithBalance,
  initiatePayout,
  getPayoutHistory
}