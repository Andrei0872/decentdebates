import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { HYDRATE } from "next-redux-wrapper";
import { RootState } from "..";

export interface Debate {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string;
  username: string;
  userId: number;
}

export interface DebateMetadata {
  debateId: number;
  debateTitle: string;
}

export enum ArgumentType {
  PRO = 'PRO',
  CON = 'CON',
}

export interface DebateArgument {
  argumentId: number;
  debateId: number;
  debateTitle: string;
  ticketId: number;
  title: string;
  content?: string;
  createdById: number;
  argumentType: ArgumentType;
  createdAt: string;
  username: string;
  counterargumentTo: number;
}

interface ExpandedArgument {
  id: number;
  content: string;
}

export interface CurrentDebate {
  args: DebateArgument[];
  metadata: DebateMetadata;
  crtExpandedArgument?: ExpandedArgument;
}

export interface DebatesState {
  list: Debate[] | null;
  crtDebate: CurrentDebate | null;
}

const initialState: DebatesState = {
  list: null,
  crtDebate: null,
};

export const debatesSlice = createSlice({
  name: 'debates',
  initialState,
  reducers: {
    setDebates(state, action: PayloadAction<DebatesState['list'] | null>) {
      state.list = action.payload;
    },
    setCurrentDebate (state, action: PayloadAction<CurrentDebate | null>) {
      state.crtDebate = action.payload;
    },
    setCrtExpandedArgument (state, action: PayloadAction<ExpandedArgument | undefined>) {
      if (!state.crtDebate) {
        return;
      }

      state.crtDebate.crtExpandedArgument = action.payload;
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

export const { setDebates, setCurrentDebate, setCrtExpandedArgument } = debatesSlice.actions;

export const selectCurrentDebate = (state: RootState) => state.debates.crtDebate;
export const selectCrtExpandedArgument = (state: RootState) => state.debates.crtDebate?.crtExpandedArgument;