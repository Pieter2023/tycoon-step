let muted = false;

export const setMuted = (m: boolean) => {
  muted = !!m;
};

const getCtx = (() => {
  let ctx: AudioContext | null = null;
  return () => {
    if (ctx) return ctx;
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  };
})();

function beep(freq = 440, durationMs = 60, volume = 0.06) {
  if (muted) return;
  const ctx = getCtx();
  if (!ctx) return;

  try {
    if (ctx.state === "suspended") void ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = freq;

    gain.gain.value = 0;
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + durationMs / 1000 + 0.02);
  } catch {
    // fail silently if audio blocked
  }
}

export const playClick = () => beep(520, 30, 0.05);
export const playTick = () => beep(480, 25, 0.04);

export const playPurchase = () => beep(780, 70, 0.06);
export const playSell = () => beep(300, 70, 0.06);

export const playMoneyGain = (_amount?: number) => beep(880, 90, 0.07);
export const playMoneyLoss = () => beep(220, 110, 0.07);

export const playAchievement = () => beep(980, 120, 0.08);
export const playLevelUp = () => beep(1040, 140, 0.08);
export const playVictory = () => beep(1200, 200, 0.09);

export const playWarning = () => beep(180, 140, 0.08);
export const playError = () => beep(130, 160, 0.09);
export const playNotification = () => beep(700, 80, 0.06);
