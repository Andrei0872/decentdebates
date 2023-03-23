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

export interface Debate {
  id: number;
  title: string;
  createdAt: string;
  modifiedAt: string;
  username: string;
  userId: number;
}

export interface DebateMetadata extends Debate {
  ticketId: number;
  debateTags: string;
}

export interface DebateMetadataResponse {
  debateMetadata: DebateMetadata;
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

export const submitDraft = (params: UpdateDraftParams) => {
  return api.post(`${ROOT_PATH}/${params.debateId}/draft/${params.draftId}/save`, params.draftData)
    .then(r => r.data);
}

export const fetchDebateMetadata = (ticketId: string): Promise<DebateMetadataResponse> => {
  return api.get(`${ROOT_PATH}/metadata/${ticketId}`)
    .then(r => r.data)
}