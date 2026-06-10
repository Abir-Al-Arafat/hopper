/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
import { Socket } from 'socket.io';

declare module "socket.io" {
    interface Socket {
        user: {
            userId: string;
            socketId: string;
        };
    }
}