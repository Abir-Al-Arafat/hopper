/* eslint-disable @typescript-eslint/no-explicit-any */
import { parse } from 'date-fns';
import { DateTime } from 'luxon';
import sendNotification from '../../../socket/sendNotification';
import { USER_ROLE } from '../../constant';
import { TAuthUser } from '../../interface/authUser';
import { NOTIFICATION_TYPE } from '../notification/notification.interface';
import User from '../user/user.model';
import { TScheduleJobCreate } from './scheduleJob.interface';
import { JobService } from '../job/job.service';
import ScheduleJob from './scheduleJob.model';

const scheduleJobCreate = async (
  payload: Partial<TScheduleJobCreate & { timeZone: string }>,
  user: TAuthUser,
) => {
  const submittedDate = parse(
    payload.dateTime!,
    'yyyy-MM-dd HH:mm',
    new Date(),
  );
  const submittedHours = submittedDate.getHours();
  const submittedMinutes = submittedDate.getMinutes();

  submittedDate.setMilliseconds(0);

  let notified = false;
  let jobCreated = false;
  const notificationMinutes = new Date(
    submittedDate.getTime() - 10 * 60 * 1000,
  ).getMinutes();

  const intervalId = setInterval(async () => {
    console.log('enter the interval');
    const dhakaTime = DateTime.now().setZone(payload.timeZone);
    const nowHours = dhakaTime.hour;
    const nowMinutes = dhakaTime.minute;

    if (
      !notified &&
      nowHours === submittedHours &&
      nowMinutes === notificationMinutes
    ) {
      const hopperCompany = (await User.findOne({
        role: USER_ROLE.hopperCompany,
      })) as any;

      if (hopperCompany) {
        const notificationBody = {
          senderId: hopperCompany?._id as any,
          role: user.role,
          receiverId: user.userId as any,
          message: `Your ${payload.jobRequestData!.serviceName} has been scheduled for in 10 minutes at ${notificationMinutes}`,
          linkId: user.userId as any,
          type: NOTIFICATION_TYPE.jobSchedule,
          jobInfo: payload,
        };

        sendNotification({ userId: hopperCompany?._id }, notificationBody);
      }
      notified = true;
    }

    if (
      !jobCreated &&
      submittedHours === nowHours &&
      submittedMinutes === nowMinutes
    ) {
      const jobRequest = await JobService.createJob(
        payload.jobRequestData!,
        user,
      );
      await ScheduleJob.create({
        jobRequestId: jobRequest._id,
        submitDateTime: new Date(payload.dateTime!),
      });
      jobCreated = true;
      console.log('✅ Job scheduled and submitted');

      // ✅ Stop the interval once the job is created
      clearInterval(intervalId);
      console.log('interval clear');
    }
  }, 20000);
};

export const ScheduleJobService = {
  scheduleJobCreate,
};
