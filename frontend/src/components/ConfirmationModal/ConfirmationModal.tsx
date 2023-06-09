import { useState, cloneElement, MouseEventHandler, MouseEvent } from 'react';
import ClassName from 'classnames';

import { Button } from '../Button';
import { Modal } from '../Modal';

import './ConfirmationModal.scss';


type ConfirmationModalProps = {
    className?: string;
    title?: string;
    message?: string;
    content?: JSX.Element;
    dangerous?: boolean;
    hideButtons?: boolean;
    stopPropagation?: boolean;
    disableAccept?: boolean;
    isLoading?: boolean;
    acceptLabel?: string;
    cancelLabel?: string;
    children?: JSX.Element;
    onAccept?: MouseEventHandler<HTMLButtonElement>;
    onCancel?: MouseEventHandler<HTMLButtonElement>;
}

export const DetachedConfirmationModal = ({
    className,
    title,
    message,
    dangerous,
    hideButtons,
    stopPropagation,
    isLoading,
    acceptLabel = 'Accept',
    cancelLabel = 'Cancel',
    children,
    onAccept,
    onCancel,
}: Omit<ConfirmationModalProps, 'content'>) => {
    const handleStopPropagation = (callback?: MouseEventHandler<HTMLButtonElement>) => async (e: MouseEvent<HTMLButtonElement>) => {
        if (stopPropagation) {
            e.stopPropagation();
        }

        await callback?.(e)
    }

    const headerContent = (
        <span className="default-confirmation-modal-header">{title}</span>
    )

    const fullClassName = ClassName('default-confirmation-modal', className);

    return (
        <Modal
            className={fullClassName}
            header={headerContent}
            onHide={handleStopPropagation(onCancel)}
            stopPropagation={stopPropagation}
        >
            <div className="default-confirmation-modal-content">
                {children ? (
                    children
                ) : (
                    <span className="default-confirmation-modal-message">{message}</span>
                )}

                {!hideButtons && (
                    <div className="default-confirmation-modal-footer">
                        <Button
                            buttonSize="medium"
                            buttonStyle="outline"
                            className="cancel-button"
                            onClick={handleStopPropagation(onCancel)}
                        >
                            {cancelLabel}
                        </Button>

                        <Button
                            buttonStyle={dangerous ? 'warning' : 'filled'}
                            buttonSize="medium"
                            className="accept-button"
                            loading={isLoading}
                            onClick={handleStopPropagation(onAccept)}
                        >
                            {acceptLabel}
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    )
}

export const ConfirmationModal = ({
    children,
    onAccept,
    onCancel,
    content,
    ...props
}: Omit<ConfirmationModalProps, 'isLoading'>) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleCancel: MouseEventHandler<HTMLButtonElement> = async (e) => {
        onCancel?.(e);
        setIsVisible(false);
    }

    const handleAccept: MouseEventHandler<HTMLButtonElement> = async (e) => {
        setIsLoading(true);

        await onAccept?.(e);

        setIsVisible(false);
        setIsLoading(false);
    }

    return (
        <>
            {children && cloneElement(children, { onClick: () => setIsVisible(true)})}

            {isVisible && (
                <DetachedConfirmationModal
                    {...props}
                    children={content}
                    onAccept={handleAccept}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                />
            )}
        </>
    )
}
