import { configureStore } from '@reduxjs/toolkit'
import { moderatorSlice } from './slices/moderator.slice';
import { userReducer } from './slices/user.slice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    [moderatorSlice.name]: moderatorSlice.reducer,
  }
})

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;