import { ModeratorActivity, ModeratorActivityArgument } from "@/dtos/moderator/get-activity.dto";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "..";

export interface ModeratorState {
  activity: {
    previewedCard: ModeratorActivity | null;
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
    setActivityPreviewedCard(state, action: PayloadAction<ModeratorActivity | null>) {
      state.activity.previewedCard = action.payload;
    },
    setActivityPreviewedCardArgument(state, action: PayloadAction<ModeratorActivityArgument | null>) {
      state.activity.previewedCard = action.payload;
    },
  }
});

export const { setActivityPreviewedCard, setActivityPreviewedCardArgument } = moderatorSlice.actions;

export const selectPreviewedCard = (s: RootState) => s.moderator.activity.previewedCard;