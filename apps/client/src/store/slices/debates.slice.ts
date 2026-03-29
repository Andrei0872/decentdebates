import { Tag } from "@/types/tag";
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
  tags: Tag[];
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
  counterargumentTo?: number | null;
  counterarguments?: number[] | null;
}

export interface CurrentDebate {
  args: DebateArgument[];
  metadata: DebateMetadata;
  expandedArgumentsIDs?: number[];
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
      if (state.crtDebate) {
        state.crtDebate.expandedArgumentsIDs = [];
      }
    },
    addExpandedArgumentID (state, action: PayloadAction<{ id: number }>) {
      if (!state.crtDebate?.expandedArgumentsIDs) {
        return;
      }

      state.crtDebate.expandedArgumentsIDs = [
        ...state.crtDebate.expandedArgumentsIDs,
        action.payload.id,
      ]
    },
    removeExpandedArgumentID (state, action: PayloadAction<{ id: number }>) {
      if (!state.crtDebate?.expandedArgumentsIDs) {
        return;
      }

      state.crtDebate.expandedArgumentsIDs = state.crtDebate.expandedArgumentsIDs
        .filter(id => id !== action.payload.id);
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

export const { setDebates, setCurrentDebate, addExpandedArgumentID, removeExpandedArgumentID } = debatesSlice.actions;

export const selectCurrentDebate = (state: RootState) => state.debates.crtDebate;
export const selectExpandedArgumentsIDs = (state: RootState) => state.debates.crtDebate?.expandedArgumentsIDs;