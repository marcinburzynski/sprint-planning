import { nanoid } from 'nanoid';
import type { Server, Socket } from 'socket.io';
import type { Estimation } from '@prisma/client';

import { prisma } from '../datasources/prisma.js';
import { authenticateMiddleware } from './middlewares/auth.js';

import type { EstimationType, TicketType } from '../types/commonTypes.js';

const connectUserToSession = async (socket: Socket, sessionId: string) => {
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

        socket.on('send-estimation', async (estimation: Omit<EstimationType, 'userId'>, callback) => {
            const previousEstimation = await prisma.estimation.findFirst({
                where: { ticket: { id: estimation.ticketId }, user: { id: socket.data.user.id } }
            })

            let newEstimation: Estimation

            if (previousEstimation) {
                newEstimation = await prisma.estimation.update({
                    data: { value: estimation.value },
                    where: { id: previousEstimation.id },
                });
            } else {
                newEstimation = await prisma.estimation.create({
                    data: {
                        value: estimation.value,
                        ticket: { connect: { id: estimation.ticketId } },
                        user: { connect: { id: socket.data.user.id } },
                    }
                });
            }

            socket.to(socketSessionId!).emit('receive-estimation', newEstimation)
            callback({ estimation: newEstimation })
        })

        socket.on('create-ticket', async (ticket: Omit<TicketType, 'id'>, callback) => {
            const savedTicket = await prisma.ticket.create({
                data: {
                    id: nanoid(),
                    name: ticket.name,
                    order: ticket.order,
                    isRevealed: ticket.isRevealed || false,
                    session: {
                        connect: { id: socketSessionId },
                    }
                }
            })

            socket.to(socketSessionId).emit('receive-ticket', savedTicket)
            callback({ ticket: savedTicket })
        })

        socket.on('reveal-estimate', async (ticketId: string) => {
            const updatedTicket = await prisma.ticket.update({
                data: { isRevealed: true },
                where: { id: ticketId },
            });

            socket.to(socketSessionId!).emit('receive-ticket', updatedTicket)
        })

        socket.on('get-session-tickets', async (callback) => {
            const tickets = await prisma.ticket.findMany({ where: { sessionId: socketSessionId } });

            callback({ tickets })
        })

        socket.on('get-session-users', async (callback) => {
            const users = await prisma.user.findMany({ where: { sessions: { some: { id: socketSessionId } } } });

            callback({ users })
        })

        socket.on('get-session-estimates', async (callback) => {
            const tickets = await prisma.ticket.findMany({ where: { sessionId: socketSessionId } });

            const estimates = await prisma.estimation.findMany({
                where: {
                    ticket: {
                        id: {
                            in: tickets.map(({ id }) => id)
                        }
                    }
                }
            });

            callback({ estimates })
        })
    });
}