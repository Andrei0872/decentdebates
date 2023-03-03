import { ArgumentType } from "@/store/slices/debates.slice";
import { api } from ".";

const ROOT_PATH = '/debates';

export interface CreateArgumentData {
  title: string;
  content: string;
  argumentType: ArgumentType;
  counterargumentId?: number;
}

export const createArgument = (debateId: number, data: CreateArgumentData) => {
  return api.post(`${ROOT_PATH}/${debateId}/argument`, data)
    .then(r => r.data);
}


export const fetchArgument = (debateId: number, argId: number) => {
  return api.get(`debates/${debateId}/argument/${argId}`)
    .then(r => r.data.data);
}