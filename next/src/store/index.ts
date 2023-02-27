import { configureStore } from '@reduxjs/toolkit'
import { Context, createWrapper, MakeStore } from 'next-redux-wrapper';
import { debatesSlice } from './slices/debates.slice';
import { moderatorSlice } from './slices/moderator.slice';
import { userReducer } from './slices/user.slice';

const makeStore = (context: Context) => configureStore({
  reducer: {
    user: userReducer,
    [moderatorSlice.name]: moderatorSlice.reducer,
    [debatesSlice.name]: debatesSlice.reducer,
  }
});

export type RootStateFactory = ReturnType<typeof makeStore>;
export type RootState = ReturnType<RootStateFactory['getState']>;
export type AppDispatch = RootStateFactory['dispatch'];

export const wrapper = createWrapper(makeStore);