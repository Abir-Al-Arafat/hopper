import { kafka } from './client';

let isProducerConnect = false;
const producer = kafka.producer();

// 🔄 Kafka procedure connecting helper function
export const connectKafkaProducer = async () => {
  if (!isProducerConnect) {
    console.log('Kafka Producer Connecting...');
    await producer.connect();
    console.log('Kafka Producer Connected...');
    isProducerConnect = true;
  }
};

// 📍send location function
export const sendLocationToKafka = async (
  driverId: string,
  longitude: number,
  latitude: number,
) => {
  try {
    await connectKafkaProducer();

    await producer.send({
      topic: 'rider-updates',
      messages: [
        {
          key: driverId,
          value: JSON.stringify({ driverId, longitude, latitude }),
        },
      ],
    });

    console.log(`📦 successfully sended location Job Request Id: ${driverId}`);
  } catch (error) {
    console.error('❌ location sending problem:', error);
  }
};
