import { cacheData, deleteCache, getCachedData } from '../../../redis';
import { TAuthUser } from '../../interface/authUser';
import { minuteToSecond } from '../../utils/minitToSecond';
import { TCategory } from '../category/category.interface';
import Category from '../category/category.model';
import Vehicle from '../vehicle/vehical.model';
import { TVehicle } from '../vehicle/vehicle.interface';
import { TService } from './service.interface';
import Service from './service.model';

const createService = async (payload: TService, user: TAuthUser) => {
  const result = await Service.create(payload);

  if (result) {
    const cacheKey = `services::${user.userId}--${payload.category}`;
    await deleteCache(cacheKey);
  }

  return result;
};
const getServices = async (categoryId: string, user: TAuthUser) => {
  const cacheKey = `services::${user.userId}--${categoryId}`;
  // Try to fetch from Redis cache first
  const cached = await getCachedData<{ result: TService[] }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    return cached;
  }

  const data = await Service.find({ category: categoryId }).populate(
    'category',
  );

  const time = minuteToSecond(5);
  console.log('🚀 Serving from database');

  await cacheData(cacheKey, data, time);

  return data;
};

const getConfirmServices = async (user: TAuthUser, serviceId: string) => {
  // Type annotations for the result, service, and category
  const [result, service, category]: [
    TVehicle | null,
    TService | null,
    TCategory | null,
  ] = await Promise.all([
    Vehicle.findOne({ userId: user.userId }),
    Service.findById(serviceId),
    Service.findById(serviceId).then((service) =>
      service ? Category.findById(service.category) : null,
    ),
  ]);

  // Ensure the result, service, and category are not null before returning
  if (!result || !service || !category) {
    throw new Error('Service, vehicle, or category not found');
  }

  return { car: result, service, category };
};

const getServiceById = async (serviceId: string, user?: TAuthUser) => {
  const cacheKey = `services::${user?.userId}--${serviceId}`;
  // Try to fetch from Redis cache first
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = await getCachedData<{ result: any }>(cacheKey);
  if (cached) {
    console.log('🚀 Serving from Redis cache');
    return cached;
  }

  const result = await Service.findOne({ _id: serviceId }).populate('category');

  if (!result) {
    throw new Error('Service not found');
  }

  const time = minuteToSecond(5);
  console.log('🚀 Serving from database');

  await cacheData(cacheKey, result, time);

  return result;
};

const editService = async (
  serviceId: string,
  payload: TService,
  user: TAuthUser,
) => {
  const updated = await Service.findOneAndUpdate({ _id: serviceId }, payload, {
    new: true,
  });

  if (updated) {
    const cacheKey = `services::${user.userId}--${updated.category}`;
    await deleteCache(cacheKey);
  }

  return updated;
};

const deleteService = async (serviceId: string, user: TAuthUser) => {
  const deleted = await Service.findOneAndDelete({ _id: serviceId });

  if (deleted) {
    const cacheKey = `services::${user.userId}--${deleted.category}`;
    await deleteCache(cacheKey);
  }

  return deleted;
};

export const ServiceService = {
  createService,
  getServices,
  getServiceById,
  getConfirmServices,
  editService,
  deleteService,
};
