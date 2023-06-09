import type { Server, Socket } from 'socket.io';

import { prisma } from '../datasources/prisma.js';
import { authenticateMiddleware } from './middlewares/auth.socket.js';

import { initEstimationsSocket } from './estimations/estimations.socket.js';
import { initTicketsSocket } from './tickets/tickets.socket.js';
import { initSessionSocket } from './session/session.socket.js';
import { initDisconnectEvent } from './disconnect/disconnect.socket.js';

const connectUserToSession = async (socket: Socket, sessionId: string) => {
    try {
        const session = await prisma.session.findUnique({ where: { id: sessionId }, include: { users: true } });

        if (!session) {
            return socket.disconnect();
        }

        if (!session.users.find((user) => user.id === socket.data.user.id)) {
            await prisma.session.update({
                where: { id: sessionId },
                data: {
                    users: {
                        connect: [{ id: socket.data.user.id }],
                    },
                },
            });
        }
    } catch (e) {
        console.error(e);
    }
};

export const initSocket = (io: Server) => {
    io.use(authenticateMiddleware);

    io.on('connection', (socket) => {
        const socketSessionId = socket.handshake.query.sessionId;

        if (typeof socketSessionId !== 'string' || !socketSessionId) {
            return socket.disconnect();
        }

        connectUserToSession(socket, socketSessionId);

        socket.join(socketSessionId)
        socket.in(socketSessionId).emit('user-joined', socket.data.user)

        initEstimationsSocket(io, socket, socketSessionId);
        initTicketsSocket(io, socket, socketSessionId);
        initSessionSocket(io, socket, socketSessionId);
        initDisconnectEvent(io, socket, socketSessionId);
    });
}
