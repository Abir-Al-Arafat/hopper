/* eslint-disable @typescript-eslint/no-explicit-any */
import { JwtPayload, Secret } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { TAuthUser } from '../app/interface/authUser';
import { sendLocationToKafka } from '../app/kafka/producer';
import { TMessage } from '../app/modules/message/message.interface';
import { MessageService } from '../app/modules/message/message.service';
import { decodeToken } from '../app/utils/decodeToken';
import config from '../config'; // Ensure jwtSecret is defined in config

interface ILocation {
  driverId: string;
  longitude: number;
  latitude: number;
}

export interface IConnectedUser {
  socketId: string;
  userId: string; // You can add other properties that `connectUser` may have
}
export const connectedUser: Map<string, object> = new Map();

const socketIO = (io: Server) => {
  // Initialize an object to store the active users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeUsers: { [key: string]: any } = {};

  let user: JwtPayload | undefined | TAuthUser = undefined;

  // Middleware to handle JWT authentication
  io.use(async (socket: Socket, next) => {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.token ||
      socket.handshake.headers.authorization;

    if (!token) {
      return next(new Error('Authentication error: Token not provided.'));
    }
    try {
      user = decodeToken(
        token,
        config.jwt.access_token as Secret,
      ) as JwtPayload;
      activeUsers[socket.id] = user.userId;
      socket.user = { userId: user.userId, socketId: socket.id };
      // Attach user info to the socket object
      if (
        socket.user.userId === undefined ||
        socket.user.socketId === undefined
      ) {
        // eslint-disable-next-line no-console
        console.log('userId or socketId is undefined');
        return;
      }
      next();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('JWT Verification Error:', err);
      return next(new Error('Authentication error: Invalid token.'));
    }
  });

  // On new socket connection
  io.on('connection', (socket: Socket) => {
    // eslint-disable-next-line no-console
    console.log('connected', socket.id);
    if (
      socket?.user?.userId === undefined ||
      socket.user.socketId === undefined
    ) {
      // eslint-disable-next-line no-console
      console.log('userId or socketId is undefined');
      return;
    }
    connectedUser.set(socket.user.userId, { socketId: socket.user.socketId });

    io.emit('online_users', Array.from(connectedUser.keys()));

    // sending message
    socket.on(
      'send_message',
      async (payload: Partial<TMessage & { receiverId: string }>, callback) => {
        try {
          if (!payload.conversationId || !payload.text_message) {
            return callback?.({ success: false, message: 'Invalid payload' });
          }

          const savedMessage = await MessageService.createMessage(payload);

          io.emit(`receive_message::${payload.conversationId}`, savedMessage);

          callback?.({
            success: true,
            message: 'Message sent successfully',
            data: savedMessage,
          });

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const receiver: any = connectedUser.get(
            payload!.receiverId!.toString(),
          );

          const sender: any = connectedUser.get(payload!.sender!.toString());

          if (receiver) {
            console.log(receiver.socketId, 'receiver is socket id');
            io.to(receiver.socketId).emit('new_message', {
              success: true,
              data: savedMessage,
            });
          }

          if (sender) {
            console.log(sender.socketId, 'sender');
            io.to(sender.socketId).emit('new_message', {
              success: true,
              data: savedMessage,
            });
          }
        } catch (error) {
          console.error('Error sending message:', error);
          callback?.({ success: false, message: 'Internal server error' });
        }
      },
    );

    socket.on('typing', async (payload, callback) => {
      if (payload.status === true) {
        io.emit(`typing::${payload.receiverId}`, true);
        callback({ success: true, message: payload, result: payload });
      } else {
        io.emit(`typing::${payload.receiverId}`, false);
        callback({ success: false, message: payload, result: payload });
      }
    });

    socket.on('joinLocationRoom', (payload: { driverId: string }, callback) => {
      const room = `driver_location::${payload.driverId}`;
      socket.join(room);
      console.log(`📍 driver joined room: ${room}`);
      callback({ success: true, message: 'Joined room successfully' });
    });

    socket.on('client_location', async (payload: ILocation, callback) => {
      const longitude = Number(payload.longitude);
      const latitude = Number(payload.latitude);

      await sendLocationToKafka(payload.driverId, longitude, latitude);

      callback({
        success: true,
        message: 'Location sent successfully',
        data: payload,
      });
    });

    socket.on('disconnect', () => {
      // eslint-disable-next-line no-console
      console.log('Socket disconnected', socket.id);
      // You can remove the user from active users if needed
      delete activeUsers[socket.id];
      if (
        socket?.user?.userId === undefined ||
        socket.user.socketId === undefined
      ) {
        // eslint-disable-next-line no-console
        console.log('userId or socketId is undefined');
        return;
      }
      connectedUser.delete(socket.user.userId);
      io.emit('online_users', Array.from(connectedUser.keys()));
    });

    socket.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('Socket error:', err);
    });
  });
};

export default socketIO;
