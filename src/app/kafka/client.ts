import { Kafka } from 'kafkajs';
import config from '../../config';

export const kafka = new Kafka({
  clientId: 'hopper-roadside',
  brokers: [`${config.ip}:9092`],
});
