import { CurrentDebate } from "@/store/slices/debates.slice";

export const getDebateDTO = (debateInfo: CurrentDebate) => {
  if (!debateInfo.args.length) {
    return debateInfo;
  }
  
  const argsWithCounterargs = new Map<number, number[]>();

  for (const arg of debateInfo.args) {
    const counterargumentId = arg.counterargumentTo;
    if (!counterargumentId) {
      continue;
    }

    argsWithCounterargs.set(counterargumentId, (argsWithCounterargs.get(counterargumentId) ?? []).concat([arg.argumentId]));
  }

  debateInfo.args = debateInfo.args.map(a => ({ ...a, counterarguments: argsWithCounterargs.get(a.argumentId) ?? null }));
  return debateInfo;
}