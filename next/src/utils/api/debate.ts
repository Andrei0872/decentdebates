import { ArgumentType, DebateArgument } from "@/store/slices/debates.slice";
import { api } from ".";
import { CurrentDebate } from '@/store/slices/debates.slice';

const ROOT_PATH = '/debates';

export interface CreateArgumentData {
  title: string;
  content: string;
  argumentType: ArgumentType;
  counterargumentId?: number;
}

export interface UpdateDraftParams {
  debateId: number;
  draftId: number;
  draftData: CreateArgumentData;
}

export interface GetDraftResponse {
  debate: Pick<CurrentDebate, 'metadata' | 'args'>;
  draft: DebateArgument;
}

export const createArgument = (debateId: number, data: CreateArgumentData) => {
  return api.post(`${ROOT_PATH}/${debateId}/argument`, data)
    .then(r => r.data);
}

export const fetchArgument = (debateId: number, argId: number) => {
  return api.get(`debates/${debateId}/argument/${argId}`)
    .then(r => r.data.data);
}

export const fetchDebateById = (debateId: number) => {
  return api.get(`/debates/${debateId}`)
    .then(r => r.data.data);
}

export const saveArgumentAsDraft = (debateId: number, data: CreateArgumentData) => {
  return api.post(`${ROOT_PATH}/${debateId}/draft`, data)
    .then(r => r.data);
}

export const fetchDraft = (debateId: number, argId: number): Promise<GetDraftResponse> => {
  return api.get(`${ROOT_PATH}/${debateId}/draft/${argId}?includeDebate=true`)
    .then(r => r.data.data);
}

export const updateDraft = (params: UpdateDraftParams) => {
  return api.patch(`${ROOT_PATH}/${params.debateId}/draft/${params.draftId}`, params.draftData)
    .then(r => r.data);
}