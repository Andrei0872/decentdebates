import { api } from ".";

export const fetchArgument = (debateId: number, argId: number) => {
  return api.get(`moderator/debates/${debateId}/argument/${argId}`)
    .then(r => r.data.data);
}