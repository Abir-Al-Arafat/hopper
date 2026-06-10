import cron from 'node-cron';
import MySubscription from '../mySubscription/mySubscription.model';
import User from '../user/user.model';


export const startScheduler = (): void => {
  // cron.schedule('*/5 * * * * *', async () => {
  cron.schedule('0 0 * * *', async () => {
    try {
      const now = new Date();

      // 1. Find expired subscriptions
      const expiredSubscriptions = await MySubscription.find({
        expiryIn: { $lte: now },
      }).select('userId');

      if (!expiredSubscriptions.length) {
        console.log('[Scheduler] No expired subscriptions found');
        return;
      }

      // 2. Extract userIds
      const userIds = expiredSubscriptions.map(sub => sub.userId);

      // 3. Update users
      const result = await User.updateMany(
        { _id: { $in: userIds }, isSubscribed: true },
        { $set: { isSubscribed: false } }
      );

      console.log(
        `[Scheduler] expiredSubscriptions: ${result.modifiedCount} users updated`
      );

      // 4. (Optional) Remove or mark expired subscriptions
      // Option A: delete
      // await MySubscription.deleteMany({ expiryIn: { $lte: now } });

      // Option B (better): add a field like isExpired and update instead
      // await MySubscription.updateMany(
      //   { expiryIn: { $lte: now } },
      //   { $set: { isExpired: true } }
      // );

    } catch (err) {
      console.error('[Scheduler] expiredSubscriptions error:', err);
    }
  });
};