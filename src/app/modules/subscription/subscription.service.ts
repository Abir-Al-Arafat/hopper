import httpStatus from 'http-status';
import AppError from '../../utils/AppError';
import { TSubscription } from './subscription.interface';
import Subscription from './subscription.model';
import { TAuthUser } from '../../interface/authUser';
import MySubscription from '../mySubscription/mySubscription.model';

const createSubscription = async (payload: TSubscription) => {
  const subscription = await Subscription.create(payload);
  return subscription;
};

const getSubscriptions = async () => {
  const subscriptions = await Subscription.find();
  return subscriptions;
};

const getSubscription = async (subscriptionId: string) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription)
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  return subscription;
};

const deleteSubscription = async (subscriptionId: string) => {
  const subscription = await Subscription.findByIdAndDelete(subscriptionId);
  if (!subscription)
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  return subscription;
};

const updateSubscription = async (
  subscriptionId: string,
  payload: TSubscription,
) => {
  const subscription = await Subscription.findByIdAndUpdate(
    subscriptionId,
    payload,
    { new: true },
  );
  if (!subscription)
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  return subscription;
};

const getMySubscription = async (user: TAuthUser) => {
  const subscription = await MySubscription.findOne({ userId: user.userId });
  if (!subscription)
    throw new AppError(httpStatus.NOT_FOUND, 'Subscription not found');
  return subscription;
};

export const SubscriptionService = {
  getSubscription,
  getSubscriptions,
  createSubscription,
  deleteSubscription,
  updateSubscription,
  getMySubscription,
};
