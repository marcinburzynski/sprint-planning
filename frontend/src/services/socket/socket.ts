import { io, Socket as SocketIo } from "socket.io-client";

import { store } from '../../store';
import { listenToEvents } from './socketListener';
import { TOKEN_LOCAL_STORAGE_KEY } from '../../constants/localStorageKeys';

import type { UserType, EstimationType, TicketType, SessionType } from '../../types/commonTypes';

class Socket {

    client?: SocketIo;
    sessionId?: string;
    token?: string;

    constructor() {
        this.token = localStorage.getItem(TOKEN_LOCAL_STORAGE_KEY) || undefined;
    }


    disconnect = () => {
        this.client?.disconnect();
        this.sessionId = undefined;
        this.client = undefined;
    }

    joinSession = async (sessionId: string, token: string) => {
        this.client = io(`wss://${window.location.hostname}`, {
            auth: { token },
            query: { sessionId },
        });

        this.sessionId = sessionId;
        this.token = token;

        listenToEvents(this.client, store)
    }

    sendEstimation = (estimation: Omit<EstimationType, 'userId'>) => {
        return new Promise<{ estimation: EstimationType }>((resolve) => {
            this.client?.emit('send-estimation', estimation, resolve);
        });
    };

    createTicket = (ticket: Omit<TicketType, 'id'>) => {
        return new Promise<{ ticket: TicketType }>((resolve) => {
            this.client?.emit('create-ticket', ticket, resolve);
        });
    }

    createMultipleTickets = (tickets: Omit<TicketType, 'id'>[]) => {
        return new Promise<{ tickets: TicketType[] }>((resolve) => {
            this.client?.emit('create-multiple-tickets', tickets, resolve);
        });
    }

    removeTicket = (ticketId: string) => {
        return new Promise((resolve) => {
            this.client?.emit('remove-ticket', ticketId, resolve);
        });
    };

    revealTicketEstimate = (ticketId: string) => {
        return new Promise((resolve) => {
            this.client?.emit('reveal-estimate', ticketId, resolve);
        })
    }

    restartTicketEstimation = (ticketId: string) => {
        return new Promise((resolve) => {
            this.client?.emit('restart-estimation', ticketId, resolve);
        })
    }

    getSessionTickets = () => {
        return new Promise<{ tickets: TicketType[] }>((resolve) => {
            this.client?.emit('get-session-tickets', resolve);
        })
    }

    getSessionUsers = () => {
        return new Promise<{ users: UserType[] }>((resolve) => {
            this.client?.emit('get-session-users', resolve);
        })
    }

    getSessionEstimates = () => {
        return new Promise<{ estimates: EstimationType[] }>((resolve) => {
            this.client?.emit('get-session-estimates', resolve);
        })
    }

    getSession = (sessionId: string) => {
        return new Promise<{ session: SessionType }>((resolve) => {
            this.client?.emit('get-session', sessionId, resolve);
        });
    }

    setSelectedTicketForEveryone = (ticketId: string) => {
        return new Promise((resolve) => {
            this.client?.emit('set-selected-ticket-for-everyone', ticketId, resolve);
        });
    }

    setTicketsOrder = (orderedTicketIds: string[]) => {
        type SetTicketsOrderRes = {
            error?: Record<string, unknown>;
            ok?: true;
        }

        return new Promise<SetTicketsOrderRes>((resolve) => {
            this.client?.emit('set-tickets-order', orderedTicketIds, resolve);
        })
    }
}


export const socket = new Socket();
