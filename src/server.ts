/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import colors from 'colors';
import { createServer, Server } from 'http';
import mongoose from 'mongoose';
import { Server as SocketIoServer } from 'socket.io';
import app from './app';
import seedAdmin from './app/DB/seedAdmin';
import config from './config';
import { errorLogger, logger } from './shared/logger';
import socketIO from './socket';
import { connectKafkaAdmin } from './app/kafka/admin';
import { connectKafkaProducer } from './app/kafka/producer';
import { connectKafkaConsumer } from './app/kafka/consumer';
import { startScheduler } from './app/modules/cornJobs/schedule';
import 'dotenv/config';
let server: Server;

const socketServer = createServer();

export const IO: SocketIoServer = new SocketIoServer(socketServer, {
  cors: {
    origin: '*', // Change this to the actual client URL in production
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
});

// Connect to database and start the server
async function main() {
  try {
    await mongoose.connect(config.database_url as string).then(() => {
      console.log('Database connected successfully');
    });
    // kafka connection
    await connectKafkaAdmin();
    await connectKafkaProducer();
    await connectKafkaConsumer();

    server = app.listen(config.port, () => {
      console.log(
        colors.green(
          `Server is running successfully ${config.ip}:${config.port}`,
        ).bold,
      );
      logger.info(`Server is running on port ${config.port}`);
    });

    socketServer.listen(config.socket_port, () => {
      console.log(
        colors.yellow(
          `Socket is listening on ${config.ip}:${config.socket_port}`,
        ).bold,
      );
      logger.info(`Socket is listening on port ${config.socket_port}`);
    });

    socketIO(IO);
    globalThis.io = IO;
    seedAdmin();
    startScheduler();
  } catch (error: any) {
    console.error('Server start error:', error);
    logger.error({
      message: error.message,
      status: error.status || 500,
      method: 'server-start',
      url: 'server-start',
      stack: error.stack,
    });
    process.exit(1);
  }
}

main();
// Seed Admin in database if not exist
seedAdmin();

// Handle unhandled promise rejection
process.on('unhandledRejection', (err: any) => {
  console.log(`👹 unhandledRejection is detected, shuting down....`, err);
  errorLogger.error(err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

// Handle uncaught exception
process.on('uncaughtException', (err: any) => {
  console.log(`👹 uncaughtException is detected, shuting down....`, err);
  errorLogger.error(err);
  process.exit(1);
});

// process.on("SIGINT", async () => {
//   console.log(colors.yellow('🚦 Closing Redis connection...'));
//   await redis.quit()
//   console.log(colors.green('✅ Redis connection closed'));
//   process.exit(0);
// })
