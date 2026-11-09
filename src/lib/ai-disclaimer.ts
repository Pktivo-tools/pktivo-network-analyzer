const DISMISSAL_KEY = 'pktivo.ai-disclaimer.dismissed.v1';
type DisclaimerStorage = Pick<Storage, 'getItem' | 'setItem'>;

export { DISMISSAL_KEY };

/** The notice appears on entry until the visitor explicitly asks to silence it. */
export function shouldShowDisclaimer(storage: DisclaimerStorage): boolean {
  try {
    return storage.getItem(DISMISSAL_KEY) !== '1';
  } catch {
    return true;
  }
}

export function dismissDisclaimer(storage: DisclaimerStorage): boolean {
  try {
    storage.setItem(DISMISSAL_KEY, '1');
    return true;
  } catch {
    return false;
  }
}
