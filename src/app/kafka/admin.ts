import { kafka } from './client';

export async function connectKafkaAdmin() {
  // init admin
  const admin = kafka.admin();
  console.log('Kafka Admin Connecting...');
  await admin.connect();
  console.log('Kafka Admin Connected...');

  // create topics
  await admin.createTopics({
    topics: [
      {
        topic: 'rider-updates',
        numPartitions: 2,
        replicationFactor: 1,
      },
    ],
  });

  await admin.disconnect();
  console.log('Kafka Admin Disconnected...');
}
