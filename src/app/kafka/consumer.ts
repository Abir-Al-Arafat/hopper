import { IO } from '../../server';
import { kafka } from './client';

const consumer = kafka.consumer({ groupId: 'hopper-roadside' });
let isConsumerConnect = false;
let isSubscribe = false;

export const connectKafkaConsumer = async () => {
  if (!isConsumerConnect) {
    console.log('Kafka Consumer Connecting...');
    await consumer.connect();
    console.log('Kafka Consumer Connected...');
    isConsumerConnect = true;
  }

  if (!isSubscribe) {
    console.log('Kafka Consumer Subscribing...');
    await consumer.subscribe({ topic: 'rider-updates', fromBeginning: true });
    console.log('Kafka Consumer Subscribed...');
    isSubscribe = true;
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!IO || !message.value) return;

      if (topic === 'rider-updates') {
        const { driverId, longitude, latitude } = JSON.parse(
          message.value.toString(),
        );

        const room = `driver_location::${driverId}`;
        IO.to(room).emit('locationUpdate', {
          driverId,
          longitude,
          latitude,
        });
      }
    },
  });
  isConsumerConnect = true;
  consumer.on('consumer.crash', async (event) => {
    console.error('💥 Consumer crashed:', event.payload.error);
    console.log('🔄 Reconnecting...');
    await consumer.disconnect();
    await connectKafkaConsumer();
  });
};

connectKafkaConsumer().catch((error) =>
  console.error('Error in Kafka consumer:------------------->>', error),
);
