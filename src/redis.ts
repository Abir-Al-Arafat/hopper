/* eslint-disable no-console */
import Redis, { Redis as RedisClient } from 'ioredis';
import colors from 'colors';

// Define the type for cache data
interface CacheData {
  key: string;
  value: string | number | object;
  ttl: number;
}

const redis: RedisClient = new Redis({
  // host: 'localhost',
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryStrategy: (times) => {
    if (times > 10) return null;
    return Math.min(times * 100, 3000);
  },
  keyPrefix: 'app:',
  db: 0,
  maxRetriesPerRequest: null,
  connectTimeout: 1000,
  enableOfflineQueue: false,
  showFriendlyErrorStack: true,
});

redis.on('connect', () => {
  console.log(colors.blue('✅ Connected to Redis').bold);
});

redis.on('error', (err) => {
  console.error(colors.red('❌ Redis connection error:'), err);
});

// Function to cache data with types
export async function cacheData(
  key: string,
  value: string | number | object,
  ttl: number = 60,
): Promise<void> {
  try {
    // If value is an object, we need to stringify it before caching
    const stringValue =
      typeof value === 'object' ? JSON.stringify(value) : value;
    await redis.set(key, stringValue, 'EX', ttl); // TTL for cache expiration
  } catch (error) {
    console.error('Error caching data:', error);
  }
}

// Function to fetch cached data with types
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    if (!data) return null;

    // Try parsing the data if it's in JSON format
    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  } catch (error) {
    console.error('Error fetching cached data:', error);
    return null;
  }
}

// For batch operations, using pipeline with types
export async function batchCacheData(dataArray: CacheData[]): Promise<void> {
  const pipeline = redis.pipeline();

  // Add multiple commands to the pipeline
  dataArray.forEach((item) => {
    const stringValue =
      typeof item.value === 'object' ? JSON.stringify(item.value) : item.value;
    pipeline.set(item.key, stringValue, 'EX', item.ttl);
  });

  try {
    await pipeline.exec();
  } catch (error) {
    console.error('Error in batch caching:', error);
  }
}

export const deleteCache = async (key: string) => {
  await redis.del(key);
};

export default redis;
