import mongoose from 'mongoose';
import JobRequest from '../jobRequest/jobRequest.model';
import { JOB_STATUS } from '../../constant';

export const driverInfoFinding = async (id: string) => {
  const jobRequest = await JobRequest.aggregate([
    {
      $match: {
        driver: new mongoose.Types.ObjectId(String(id)),
        status: JOB_STATUS.completed,
      },
    },
  ]);

  const weeklyJobCount = await JobRequest.aggregate([
    {
      $match: {
        driver: new mongoose.Types.ObjectId(String(id)),
        status: JOB_STATUS.completed,
        completedAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Filter for jobs in the last 7 days
        },
      },
    },
    {
      $count: 'weeklyJobCount', // Count the number of jobs
    },
  ]);
  // Calculate total time for all completed jobs
  const totalTime = jobRequest.reduce((acc, job) => {
    const timeDiff =
      new Date(job.completedAt).getTime() - new Date(job.assignedAt).getTime();
    return acc + timeDiff;
  }, 0);

  // Calculate the average time if there are completed jobs
  const averageTime = jobRequest.length > 0 ? totalTime / jobRequest.length : 0;

  // Convert average time to hours, minutes, and seconds
  const hours = Math.floor(averageTime / (1000 * 60 * 60));
  const minutes = Math.floor((averageTime % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((averageTime % (1000 * 60)) / 1000);

  // Return driver data with the average time
  return {
    averageTime: `${hours}h ${minutes}m ${seconds}s`,
    completedJob: jobRequest.length,
    weeklyJobCount: weeklyJobCount[0]?.weeklyJobCount || 0,
  };
};
