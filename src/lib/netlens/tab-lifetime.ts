/** No storage or networking: clear the workspace even when the browser keeps a back/forward cache. */
export function bindTabLifetime(target: Pick<Window, 'addEventListener'|'removeEventListener'>, clear:()=>void) {
  const onHide=()=>clear();
  target.addEventListener('pagehide',onHide);
  return ()=>target.removeEventListener('pagehide',onHide);
}