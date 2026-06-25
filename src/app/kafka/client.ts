import { Kafka } from 'kafkajs';
import config from '../../config';

export const kafka = new Kafka({
  clientId: 'hopper-roadside',
  // brokers: [`${config.ip}:9092`],
  brokers: [process.env.KAFKA_BROKERS || 'kafka:29092'],
});
