import { describe, it, expect } from 'vitest';
import { __testOnly_setBusinessSeed, __testOnly_nextBusinessRandom } from '../services/gameLogic';

describe('business RNG', () => {
  it('produces a deterministic sequence for the same seed', () => {
    __testOnly_setBusinessSeed(4242);
    const seqA = [
      __testOnly_nextBusinessRandom(),
      __testOnly_nextBusinessRandom(),
      __testOnly_nextBusinessRandom()
    ];

    __testOnly_setBusinessSeed(4242);
    const seqB = [
      __testOnly_nextBusinessRandom(),
      __testOnly_nextBusinessRandom(),
      __testOnly_nextBusinessRandom()
    ];

    expect(seqB).toEqual(seqA);
  });

  it('changes output when the seed changes', () => {
    __testOnly_setBusinessSeed(111);
    const first = __testOnly_nextBusinessRandom();

    __testOnly_setBusinessSeed(222);
    const second = __testOnly_nextBusinessRandom();

    expect(first).not.toBe(second);
  });
});
