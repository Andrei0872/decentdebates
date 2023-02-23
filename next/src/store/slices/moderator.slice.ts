import { CardData } from "@/dtos/moderator/get-activity.dto";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "..";

export interface ModeratorState {
  activity: {
    previewedCard: CardData | null;
  }
}

const initialState: ModeratorState = {
  activity: {
    previewedCard: null,
  }
};

export const moderatorSlice = createSlice({
  name: 'moderator',
  initialState,
  reducers: {
    setActivityPreviewedCard (state, action: PayloadAction<CardData | null>) {
      state.activity.previewedCard = action.payload;
    },
  }
});

export const { setActivityPreviewedCard } = moderatorSlice.actions;

export const selectPreviewedCard = (s: RootState) => s.moderator.activity.previewedCard;