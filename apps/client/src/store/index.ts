import { configureStore } from '@reduxjs/toolkit'
import { debatesSlice } from './slices/debates.slice';
import { moderatorSlice } from './slices/moderator.slice';
import { userReducer } from './slices/user.slice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    [moderatorSlice.name]: moderatorSlice.reducer,
    [debatesSlice.name]: debatesSlice.reducer,
  }
});

// export type RootStateFactory = ReturnType<typeof store>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
