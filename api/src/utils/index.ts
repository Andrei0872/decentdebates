export const isNumber = (arg: any) => {
  if (!arg) {
    return false;
  }

  return !Number.isNaN(+arg);
}