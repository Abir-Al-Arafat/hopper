/* eslint-disable @typescript-eslint/no-explicit-any */
import Job from '../modules/job/job.model';

export const jobUidCreate = async () => {
  const previousJobId = (await Job.findOne({})
    .sort({ createdAt: -1 })
    .exec()) as any;
  const jobUid = previousJobId ? Number(previousJobId.uid) + 1 : 1;
  return jobUid;
};
