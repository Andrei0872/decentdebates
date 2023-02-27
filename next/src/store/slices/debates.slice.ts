import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";

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
  extraReducers: {
    [HYDRATE]: (state, action) => {
      return {
        ...state,
        ...action.payload.debates
      };
    },
  },
});

export const { setDebates } = debatesSlice.actions;