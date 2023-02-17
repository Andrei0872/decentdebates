import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Debate {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string;
  username: string;
  userId: number;
}

export interface DebatesState {
  list: Debate[] | null;
}

const initialState: DebatesState = {
  list: null,
};

export const debatesSlice = createSlice({
  name: 'debates',
  initialState,
  reducers: {
    setDebates(state, action: PayloadAction<DebatesState['list'] | null>) {
      state.list = action.payload;
    },
  },
});

export const { setDebates } = debatesSlice.actions;