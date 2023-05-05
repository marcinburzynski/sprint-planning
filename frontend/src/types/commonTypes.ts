import type { RequiredBy } from './utilTypes';

export type UserType = {
    id: string;
    name: string;
    isSpectator: boolean;
    team?: string;
}

export type TicketType = {
    id: string;
    name: string;
    order: number;
    issueKey?: string;
    isRevealed?: boolean;
}

export type JiraTicketType = RequiredBy<TicketType, 'issueKey'>;

export type EstimationType = {
    ticketId: string;
    userId: string;
    value: string | null;
}
