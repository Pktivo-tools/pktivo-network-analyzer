import { describe, expect, it, vi } from 'vitest';
import { bindTabLifetime } from '@/lib/netlens/tab-lifetime';
describe('Capture tab lifetime',()=>{
  it('clears on pagehide including back/forward cache entry',()=>{const clear=vi.fn();const target=new EventTarget();const unbind=bindTabLifetime(target as unknown as Pick<Window,'addEventListener'|'removeEventListener'>,clear);target.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));expect(clear).toHaveBeenCalledTimes(1);unbind()});
  it('keeps data while switching tabs and removes its listener on disposal',()=>{const clear=vi.fn();const target=new EventTarget();const unbind=bindTabLifetime(target as unknown as Pick<Window,'addEventListener'|'removeEventListener'>,clear);target.dispatchEvent(new Event('visibilitychange'));expect(clear).not.toHaveBeenCalled();unbind();target.dispatchEvent(new Event('pagehide'));expect(clear).not.toHaveBeenCalled()});
});