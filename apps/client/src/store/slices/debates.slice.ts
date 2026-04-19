import { Tag } from "@/types/tag";
import { ArgumentType, DebateArgument } from "@decentdebates/shared-types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
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
export { ArgumentType };
export type { DebateArgument };

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
      state.crtDebate = action.payload ? { ...action.payload, expandedArgumentsIDs: [] } : null;
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
});

export const { setDebates, setCurrentDebate, addExpandedArgumentID, removeExpandedArgumentID } = debatesSlice.actions;

export const selectCurrentDebate = (state: RootState) => state.debates.crtDebate;
export const selectExpandedArgumentsIDs = (state: RootState) => state.debates.crtDebate?.expandedArgumentsIDs;
