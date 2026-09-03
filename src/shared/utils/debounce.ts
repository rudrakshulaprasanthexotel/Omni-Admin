const DEFAULT_DELAY_MS = 400;

export type DebouncedFn<Args extends unknown[]> = ((...args: Args) => void) & {
  cancel: () => void;
};

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number = DEFAULT_DELAY_MS,
): DebouncedFn<Args> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = ((...args: Args) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, delayMs);
  }) as DebouncedFn<Args>;

  debounced.cancel = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}
