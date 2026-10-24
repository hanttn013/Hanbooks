const overlays = [];
const pendingNavigation = [];
export function registerOverlay(id, close, pop) {
  overlays.push({ id, close, pop });
  return () => {
    const index = overlays.findIndex(item => item.id === id);
    if (index >= 0) overlays.splice(index, 1);
    if (!overlays.length) {
      const callbacks = pendingNavigation.splice(0);
      queueMicrotask(() => callbacks.forEach(callback => callback()));
    }
  };
}
export function afterOverlaysClosed(callback) {
  if (overlays.length) pendingNavigation.push(callback);
  else callback();
}
export function consumeOverlayPop(event) {
  return overlays.at(-1)?.pop?.(event) || false;
}
export function dismissTopOverlay() {
  const top = overlays.at(-1);
  if (!top) return false;
  top.close();
  return true;
}
