import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const LS_KEY = '@@user';
let LSUser = null;
if (global.localStorage) {
  // @ts-ignore
  LSUser = JSON.parse(localStorage.getItem(LS_KEY) || null);
}

export enum UserRoles {
  USER,
  MODERATOR,
  ADMIN,
};

export interface UserState {
  currentUser: {
    id: number;
    username: string;
    email: string;
    role: UserRoles,
  } | null;
}

const initialState: UserState = {
  currentUser: LSUser,
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