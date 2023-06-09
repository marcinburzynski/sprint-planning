import { Socket } from 'socket.io-client';

import { userJoined, userRemoved, receiveUpdatedUser } from '../../store/actions/estimation/users';
import { receiveEstimation } from '../../store/actions/estimation/estimations';
import {
    receiveTicket,
    receiveMultipleTickets,
    receiveRemoveTicket,
    receiveSelectedTicket,
    receiveTicketsOrder,
} from '../../store/actions/estimation/tickets';

import type { StoreType } from '../../store';
import type { UserType, TicketType, EstimationType } from '../../types/commonTypes';

export const listenToEvents = (socket: Socket, store: StoreType) => {
    socket.on('user-joined', (user: UserType) => {
        store.dispatch(userJoined(user));
    })

    socket.on('receive-estimation', (estimation: EstimationType) => {
        store.dispatch(receiveEstimation(estimation));
    })

    socket.on('receive-ticket', (ticket: TicketType) => {
        store.dispatch(receiveTicket(ticket));
    })

    socket.on('receive-multiple-tickets', (tickets: TicketType[]) => {
        store.dispatch(receiveMultipleTickets(tickets));
    })

    socket.on('receive-remove-ticket', (ticketId: string) => {
        store.dispatch(receiveRemoveTicket(ticketId));
    })

    socket.on('receive-selected-ticket-for-everyone', (ticketId: string) => {
        store.dispatch(receiveSelectedTicket(ticketId));
    })

    socket.on('user-removed', (userId: string) => {
        store.dispatch(userRemoved(userId));
    })

    socket.on('receive-tickets-order', (orderedTicketIds: string[]) => {
        store.dispatch(receiveTicketsOrder(orderedTicketIds));
    })

    socket.on('receive-updated-user', (user: UserType) => {
        store.dispatch(receiveUpdatedUser(user));
    })
}
