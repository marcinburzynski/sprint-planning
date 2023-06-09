import { produce } from 'immer';

import type { SessionUsersActionTypes } from '../../../actions/estimation/users';
import type { SetUserAction, UpdateUserAction } from '../../../actions/user';
import type { UserType } from '../../../../types/commonTypes';

type UsersState = {
    data: Record<string, UserType>;
    loading: boolean;
    isEmpty: boolean;
    error: boolean;
}

const UsersDefaultState: UsersState = {
    data: {},
    isEmpty: false,
    loading: false,
    error: false,
}

type UsersReducerActionTypes =
    | SessionUsersActionTypes
    | SetUserAction
    | UpdateUserAction

export const usersReducer = (state = UsersDefaultState, action: UsersReducerActionTypes) => produce(state, (draft) => {
    switch (action.type) {
        case 'GET_SESSION_USERS':
            draft.loading = true;
            break

        case 'GET_SESSION_USERS_SUCCESS':
            return {
                ...UsersDefaultState,
                data: {
                    ...state.data,
                    ...action.payload.reduce((acc, curr) => ({ ...acc, [curr.id]: curr }), {}),
                },
                isEmpty: !action.payload.length,
            }

        case 'GET_SESSION_USERS_FAILURE':
            draft.error = true;
            draft.loading = false;
            break;

        case 'USER_JOINED':
            draft.data[action.user.id] = action.user
            draft.isEmpty = false;
            break;

        case 'USER_REMOVED':
            delete draft.data[action.userId]
            break;

        case 'SET_USER':
            if (action.user.isSpectator) return state
            draft.data[action.user.id] = action.user;
            break;

        case 'UPDATE_USER_SUCCESS':
            if (draft.data[action.user.id]) {
                draft.data[action.user.id] = action.user;
            }
            break;

        case 'USERS_STATE_RESET':
            return UsersDefaultState;

        case 'RECEIVE_UPDATED_USER':
            draft.data[action.user.id] = action.user;
            break;

        default:
            return state
    }
})
