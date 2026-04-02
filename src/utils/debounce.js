export const debounce = (func, delay = 300) => {
  let timeoutId = null;
  let lastArgs = null;
  let lastThis = null;

  const debounced = function (...args) {
    lastArgs = args;
    lastThis = this;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      func.apply(lastThis, lastArgs);
    }, Math.max(0, delay));
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastThis = null;
  };

  debounced.flush = () => {
    if (!timeoutId) return;
    clearTimeout(timeoutId);
    timeoutId = null;
    func.apply(lastThis, lastArgs);
    lastArgs = null;
    lastThis = null;
  };

  return debounced;
};
