import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isEmpty, omit } from 'lodash';

import { useTypedDispatch, useTypedSelector } from '../../store/hooks';
import { socket } from '../../services/socket';
import {
    createTicket,
    getSessionTickets,
    revealTicketEstimate,
    restartTicketEstimation,
    removeTicket,
} from '../../store/actions/estimation/tickets';
import { getSessionUsers } from '../../store/actions/estimation/users';
import { getSessionEstimations, sendEstimation } from '../../store/actions/estimation/estimations';
import { Button } from '../../components/Button';
import { UserAvatar } from '../../components/UserAvatar';
import { TicketManager } from '../../components/TicketManager';
import { EstimateCardsPreview } from '../../components/EstimateCardsPreview';
import { EstimateCardPicker } from '../../components/EstimateCardPicker';
import { EstimationResults } from '../../components/EstimationResults';

import { UserType } from '../../types/commonTypes';

import './EstimationPage.scss';

const isUserComplete = (user: Partial<UserType>): user is UserType => !!(
    user.name && user.id
);

export const EstimationPage = () => {
    const dispatch = useTypedDispatch();
    const navigateTo = useNavigate();
    const { sessionId } = useParams<'sessionId'>()

    const [selectedTicketId, setSelectedTicketId] = useState<string>();

    const user = useTypedSelector((state) => state.user);
    const { id: userId, isSpectator } = user

    const {
        data: tickets,
        loading: loadingTickets,
        isEmpty: noTicketsAdded,
    } = useTypedSelector((state) => state.estimation.tickets);

    const {
        data: estimations,
        loading: loadingEstimations,
    } = useTypedSelector((state) => state.estimation.estimations);

    const {
        data: users,
        loading: loadingUsers,
        isEmpty: noUsersInSession,
    } = useTypedSelector((state) => state.estimation.users);


    const selectedTicket = selectedTicketId ? tickets[selectedTicketId] : undefined;
    const estimationsForTicket = selectedTicketId ? estimations[selectedTicketId] : undefined;
    const userEstimation = estimationsForTicket && userId ? estimationsForTicket[userId] : undefined

    const handleJoinAndLoadData = async () => {
        if (!socket.token) {
            return navigateTo(`/join/${sessionId}`);
        }

        if (!socket.sessionId && sessionId && socket.token) {
            await socket.joinSession(sessionId, socket.token);
        }

        if (!loadingTickets && !noTicketsAdded && isEmpty(tickets)) {
            dispatch(getSessionTickets());
        }

        if (!loadingUsers && !noUsersInSession && userId && isEmpty(omit(users, userId))) {
            dispatch(getSessionUsers());
        }

        if (!loadingEstimations && isEmpty(estimations)) {
            dispatch(getSessionEstimations());
        }
    }

    const getOrderedTickets = () => Object.values(tickets).sort((a, b) => a.order - b.order);

    const handleSelectFirstInOrderTicket = () => {
        const [firstTicket] = getOrderedTickets();

        setSelectedTicketId(firstTicket.id);
    };

    const handleSelectNextTicketForEstimationInOrder = () => {
        const sortedTickets = getOrderedTickets();
        const [nextTicket] = sortedTickets.filter((ticket) => !ticket.isRevealed)

        if (!nextTicket) return;

        setSelectedTicketId(nextTicket.id)
    }

    const handleCopyShareLink = () => {
        navigator.clipboard.writeText('https://localhost:5173')
    }

    useEffect(() => {
        handleJoinAndLoadData()

        return () => {
            socket.disconnect();
        }
    }, [])

    useEffect(() => {
        if (!selectedTicketId && !isEmpty(tickets)) {
            handleSelectFirstInOrderTicket();
        }
    }, [tickets, selectedTicketId])

    useEffect(() => {
        if (!selectedTicket && selectedTicketId && !isEmpty(tickets)) {
            handleSelectFirstInOrderTicket();
        }
    }, [selectedTicket, tickets])

    const activeUsers = useMemo(() => {
        return Object.values(users).filter(({ isSpectator }) => !isSpectator);
    }, [users])

    return (
        <div className="estimation-page">
            <span className="estimation-page-main-header">Sprint planning</span>

            <div className="cards-container">
                <div className="header-row">
                    <div className="header">
                        <span className="estimating-label">Estimating now:</span>
                        <span className="estimating-ticket">{selectedTicket?.name}</span>
                    </div>

                    {isSpectator && (
                        <Button
                            className="reveal-estimation-button"
                            buttonSize="medium"
                            disabled={!!selectedTicket?.isRevealed || !selectedTicketId}
                            onClick={() => selectedTicketId && dispatch(revealTicketEstimate(selectedTicketId))}
                        >
                            Reveal Cards
                        </Button>
                    )}
                </div>

                <EstimateCardsPreview
                    className="cards-preview"
                    reveal={selectedTicket?.isRevealed}
                    users={activeUsers}
                    estimations={estimationsForTicket}
                />
            </div>

            <div className="side-container">
                <div className="sidebar-header">
                    {isUserComplete(user) && (
                        <>
                            <UserAvatar user={user} className="user-avatar" />
                            <span className="username">{user.name}</span>
                        </>
                    )}

                    <Button className="share-button" buttonStyle="outline" onClick={handleCopyShareLink}>
                        Share game
                    </Button>
                </div>

                <div className="side-container-card">
                    <span className="side-container-card-header">Issues:</span>
                    <TicketManager
                        className="ticket-manager"
                        isSpectator={isSpectator}
                        users={Object.values(users)}
                        estimations={estimations}
                        tickets={Object.values(tickets)}
                        selectedTicket={selectedTicket}
                        onSelectTicket={(ticket) => setSelectedTicketId(ticket.id)}
                        onAddTicket={(name) => sessionId && dispatch(createTicket({ name }))}
                        onRemoveTicket={(ticketId) => dispatch(removeTicket(ticketId))}
                        onRestartEstimation={(ticketId) => dispatch(restartTicketEstimation(ticketId))}
                    />
                </div>
            </div>

            {selectedTicket?.isRevealed && estimationsForTicket && (
                <EstimationResults
                    className="estimation-results"
                    users={Object.values(users)}
                    ticketEstimations={estimationsForTicket}
                    onEstimateNextTicket={handleSelectNextTicketForEstimationInOrder}
                />
            )}

            {!isSpectator && !selectedTicket?.isRevealed && userId && selectedTicketId && (
                <EstimateCardPicker
                    className="card-picker"
                    freeze={selectedTicket?.isRevealed}
                    selectedCard={userEstimation}
                    onChangeSelection={(value) => dispatch(sendEstimation(selectedTicketId, value || null))}
                />
            )}
        </div>
    )
}
