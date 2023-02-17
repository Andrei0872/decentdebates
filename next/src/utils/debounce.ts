interface GenericFn {
  (this: any, ...p: any[]): any;
}

export function debounce (this: any, fn: GenericFn, ms: number) {
  let timeoutId: any = null;

  return function (this: any, ...args: any[]) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, ms);
  }
}