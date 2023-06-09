import { produce } from 'immer';

import type { EstimationsActionTypes } from '../../../actions/estimation/estimations';

export type StoredEstimations = {
    [ticketId: string]: {
        [userId: string]: string | undefined;
    };
}

type EstimationsReducerState = {
    data: StoredEstimations;
    loading: boolean;
    error: boolean;
}

const EstimationsDefaultState: EstimationsReducerState = {
    data: {},
    loading: false,
    error: false,
}

export const estimationsReducer = (state = EstimationsDefaultState, action: EstimationsActionTypes) => produce(state, (draft) => {
    switch (action.type) {
        case 'GET_SESSION_ESTIMATIONS_START':
            draft.loading = true;
            break;

        case 'GET_SESSION_ESTIMATIONS_SUCCESS':
            return {
                ...EstimationsDefaultState,
                data: action.payload.reduce((acc, curr) => {
                    acc[curr.ticketId] = {
                        ...(acc[curr.ticketId] || {}),
                        [curr.userId]: curr.value,
                    }

                    return acc
                }, {} as StoredEstimations)
            }

        case 'GET_SESSION_ESTIMATIONS_FAILURE':
            draft.loading = false;
            draft.error = true;
            break;

        case 'SEND_ESTIMATION':
        case 'RECEIVE_ESTIMATION':
            draft.data[action.estimation.ticketId] = {
                ...(state.data[action.estimation.ticketId] || {}),
                [action.estimation.userId]: action.estimation.value,
            }
            break;

        case 'ESTIMATIONS_STATE_RESET':
            return EstimationsDefaultState;

        default:
            return state
    }
})
