import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PublicUser, UserRoles } from '@decentdebates/shared-types';
import { RootState } from '..';

const LS_KEY = '@@user';

export { UserRoles };

export interface UserState {
  currentUser: PublicUser | null;
}

export type User = UserState['currentUser'];

const initialState: UserState = {
  currentUser: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser (state, action: PayloadAction<UserState['currentUser'] | null>) {
      state.currentUser = action.payload;

      if (action.payload) {
        localStorage.setItem(LS_KEY, JSON.stringify(action.payload));
      } else {
        localStorage.removeItem(LS_KEY);
      }
    },
  }
});

export const { setCurrentUser } = userSlice.actions;

export const userReducer = userSlice.reducer;

export const selectCurrentUser = (s: RootState) => s.user.currentUser;
