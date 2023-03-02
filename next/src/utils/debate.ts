import { ArgumentType, DebateArgument } from "@/store/slices/debates.slice";

export const getCorrespondingCounterargumentType = (arg: DebateArgument | undefined) => {
  if (!arg) {
    return undefined;
  }

  return arg.argumentType === ArgumentType.PRO ? ArgumentType.CON : ArgumentType.PRO;
}