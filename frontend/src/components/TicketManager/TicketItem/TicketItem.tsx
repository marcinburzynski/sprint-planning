import ClassName from 'classnames';
import { useMemo, useState } from 'react';

import { useTypedSelector } from '../../../store/hooks';
import { jira } from '../../../services/jira';
import { getUsersByTeam } from '../../../utils/users';
import { countEstimations, getEstimationMedians, getEstimationSum } from '../../../utils/estimations';
import { isJiraTicket } from '../../../types/typePredicates';
import { Dropdown, DropdownItem } from '../../Dropdown';
import { DetachedConfirmationModal } from '../../ConfirmationModal';
import { SaveEstimateToJiraModal } from '../../SaveEstimateToJiraModal';
import { IssueDetailsModal } from '../../IssueDetailsModal';

import type { StoredEstimations } from '../../../store/reducers/estimation/estimations';
import type { TicketType, UserType, EstimateCardType } from '../../../types/commonTypes';

import './TicketItem.scss';

type TicketItemProps = {
    className?: string;
    users: UserType[];
    deck: EstimateCardType[];
    ticketEstimations: StoredEstimations[string];
    ticket: TicketType;
    isSelected: boolean;
    onClick: (ticket: TicketType) => void;
    onRestartEstimation: (ticketId: string) => void;
    onRemove: (ticketId: string) => void;
}

export const TicketItem = ({
    className,
    users,
    deck,
    ticketEstimations,
    ticket,
    isSelected,
    onClick,
    onRestartEstimation,
    onRemove,
}: TicketItemProps) => {
    const [isConfirmRemoveVisible, setIsConfirmRemoveVisible] = useState(false);
    const [isSaveEstimateToJiraVisible, setIsSaveEstimateToJiraVisible] = useState(false);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);

    const user = useTypedSelector((state) => state.user);

    const handleGoToTicket = async () => {
        const jiraUrl = await jira.getJiraUrl();

        window.open(`${jiraUrl}/browse/${ticket.issueKey}`, '_blank');
    };

    const handleRestartEstimation = () => {
        const shouldRestart = window.confirm('Are you sure you want to restart estimation?');

        if (!shouldRestart) return;

        onRestartEstimation(ticket.id);
    }

    const handleRemoveTicket = () => {
        setIsConfirmRemoveVisible(false);
        onRemove(ticket.id);
    }

    const getEstimationStatusLabel = () => {
        if (ticket.isRevealed) {
            if (user.isAdmin) {
                return 'Estimate again';
            }

            return 'Estimated';
        }

        if (ticketEstimations) {
            return 'Estimating';
        }

        return 'Estimate';
    }

    const usersByTeam = useMemo(() => getUsersByTeam(users), [users]);

    const estimate = useMemo(() => {
        if (!ticketEstimations || !ticket.isRevealed) return;

        return getEstimationSum(getEstimationMedians(countEstimations(ticketEstimations, usersByTeam)), deck);
    }, [usersByTeam, ticketEstimations, deck])

    const fullClassName = ClassName('default-ticket-item', className, {
        'default-ticket-item--selected': isSelected,
    });

    const estimationStatusFullClassName = ClassName('estimation-status', {
        'estimation-status--clickable': ticket.isRevealed && user.isAdmin,
    })

    return (
        <div className={fullClassName} onClick={() => onClick(ticket)}>
            <div className="ticket-description">
                <span className="ticket-name">{ticket.name}</span>

                <span
                    className={estimationStatusFullClassName}
                    onClick={ticket.isRevealed && user.isAdmin ? handleRestartEstimation : undefined}
                >
                    {getEstimationStatusLabel()}
                </span>
            </div>

            {estimate && (
                <div className="estimate-sum-display">
                    {estimate}
                </div>
            )}

            <Dropdown
                stopPropagation
                triggerClassName="kebab-menu"
                align="end"
            >
                <DropdownItem onClick={handleGoToTicket} hidden={!ticket.issueKey}>
                    Open in Jira
                </DropdownItem>

                <DropdownItem onClick={() => setIsDetailsModalVisible(true)} hidden={!ticket.issueKey}>
                    Issue details
                </DropdownItem>

                <DropdownItem
                    onClick={() => setIsSaveEstimateToJiraVisible(true)}
                    hidden={!isJiraTicket(ticket) || !estimate || !user.isAdmin}
                >
                    Save estimate to Jira
                </DropdownItem>

                <DropdownItem onClick={handleRestartEstimation} hidden={!ticket.isRevealed || !user.isAdmin}>
                    Restart estimation
                </DropdownItem>

                <DropdownItem onClick={() => setIsConfirmRemoveVisible(true)} hidden={!user.isAdmin}>
                    Remove
                </DropdownItem>
            </Dropdown>

            {isConfirmRemoveVisible && (
                <DetachedConfirmationModal
                    dangerous
                    stopPropagation
                    title="Are you sure?"
                    message={'This action will remove ticket from the estimation. \nAll changes will be lost. \nIt will not affect Jira tickets.'}
                    onAccept={handleRemoveTicket}
                    onCancel={() => setIsConfirmRemoveVisible(false)}
                />
            )}

            {isSaveEstimateToJiraVisible && isJiraTicket(ticket) && estimate && (
                <SaveEstimateToJiraModal
                    ticket={ticket}
                    deck={deck}
                    initialEstimation={estimate}
                    onHideModal={() => setIsSaveEstimateToJiraVisible(false)}
                />
            )}

            {isDetailsModalVisible && isJiraTicket(ticket) && (
                <IssueDetailsModal issueKey={ticket.issueKey} onHide={() => setIsDetailsModalVisible(false)} />
            )}
        </div>
    )
}
