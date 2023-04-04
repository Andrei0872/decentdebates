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

export const fetchArgument = (debateId: number, argId: number): Promise<DebateArgument> => {
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

export interface CreateDebateData {
  title: string;
  tagsIds: number[];
  createdTags: string[];
}
export const createDebate = (data: CreateDebateData): Promise<{ message: string }> => {
  return api.post(`${ROOT_PATH}`, data)
    .then(r => r.data);
}

export interface RawDebateFilters {
  query?: string;
  tags?: string[];
}
export interface DebateFilters {
  queryStr?: string;
  tags?: string;
}
export const fetchDebatesWithFilters = (filters: RawDebateFilters) => {
  const queryParams: DebateFilters = {};

  if (filters.query) {
    queryParams.queryStr = filters.query;
  }

  if (filters.tags) {
    queryParams.tags = filters.tags.join(',');
  }

  const encodedQueryParams = btoa(JSON.stringify(queryParams));
  return api.get(`/debates?q=${encodedQueryParams}`)
    .then(r => r.data.data)
}