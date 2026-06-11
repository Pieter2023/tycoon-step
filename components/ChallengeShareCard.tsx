import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameState } from '../types';

// Shareable end-of-run summary card for the Daily Challenge.
// Draws a 1200x630 (OG-image sized) canvas: score, net-worth curve,
// defining events, and a link back to the game. No extra deps.

const CARD_W = 1200;
const CARD_H = 630;
const GAME_URL = 'https://tycoonjan22026.netlify.app';

const fmtMoney = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v);

const yearsMonths = (months: number) => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y <= 0) return `${m}mo`;
  return m === 0 ? `${y}y` : `${y}y ${m}mo`;
};

/** Pick up to 3 "defining" events spread across the run. */
export const pickDefiningEvents = (
  events: { month: number; title: string }[] | undefined
): { month: number; title: string }[] => {
  const list = events || [];
  if (list.length <= 3) return list;
  const first = list[0];
  const mid = list[Math.floor(list.length / 2)];
  const last = list[list.length - 1];
  return [first, mid, last];
};

interface ChallengeShareCardProps {
  gameState: GameState;
  netWorth: number;
  onClose?: () => void;
}

const drawCard = (canvas: HTMLCanvasElement, gameState: GameState, netWorth: number) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const ch = gameState.challenge;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  // Subtle grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= CARD_W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CARD_H); ctx.stroke();
  }
  for (let y = 0; y <= CARD_H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CARD_W, y); ctx.stroke();
  }

  // Header
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.fillText('TYCOON · DAILY CHALLENGE', 60, 78);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  ctx.fillText(ch?.id || '', 60, 116);

  // Character (right-aligned header)
  const charName = gameState.character?.name || 'Player';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${gameState.character?.avatarEmoji || ''}  ${charName}`, CARD_W - 60, 78);
  ctx.textAlign = 'left';

  // Outcome line
  const months = Math.min(gameState.month - 1, ch?.targetMonths || 120);
  let outcome: string;
  let outcomeColor = '#34d399';
  if (gameState.isBankrupt) {
    outcome = `Went bankrupt after ${yearsMonths(months)}`;
    outcomeColor = '#f87171';
  } else if (gameState.hasWon) {
    const winMonth = gameState.prestige?.fastestWin || months;
    outcome = `Financially free in ${yearsMonths(winMonth)}`;
  } else {
    outcome = `Survived the 10-year sprint`;
    outcomeColor = '#facc15';
  }
  ctx.fillStyle = outcomeColor;
  ctx.font = 'bold 34px system-ui, -apple-system, sans-serif';
  ctx.fillText(outcome, 60, 180);

  // Score
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 86px system-ui, -apple-system, sans-serif';
  ctx.fillText(fmtMoney(netWorth), 60, 280);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '24px system-ui, -apple-system, sans-serif';
  ctx.fillText('FINAL NET WORTH', 62, 316);

  // Net worth curve (right block)
  const history = gameState.netWorthHistory || [];
  const chartX = 620, chartY = 150, chartW = 520, chartH = 200;
  if (history.length >= 2) {
    const values = history.map(h => h.value);
    const min = Math.min(...values, 0);
    const max = Math.max(...values, 1);
    const span = max - min || 1;
    const px = (i: number) => chartX + (i / (history.length - 1)) * chartW;
    const py = (v: number) => chartY + chartH - ((v - min) / span) * chartH;

    // Zero line
    if (min < 0) {
      ctx.strokeStyle = 'rgba(148,163,184,0.35)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(chartX, py(0)); ctx.lineTo(chartX + chartW, py(0)); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Fill
    const grad = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
    grad.addColorStop(0, 'rgba(52, 211, 153, 0.35)');
    grad.addColorStop(1, 'rgba(52, 211, 153, 0.02)');
    ctx.beginPath();
    ctx.moveTo(px(0), py(values[0]));
    values.forEach((v, i) => ctx.lineTo(px(i), py(v)));
    ctx.lineTo(chartX + chartW, chartY + chartH);
    ctx.lineTo(chartX, chartY + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    ctx.moveTo(px(0), py(values[0]));
    values.forEach((v, i) => ctx.lineTo(px(i), py(v)));
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 4;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '20px system-ui, -apple-system, sans-serif';
    ctx.fillText('NET WORTH OVER 10 YEARS', chartX, chartY + chartH + 34);
  }

  // Defining events
  const defining = pickDefiningEvents(gameState.challengeEvents);
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText('THE RUN IN 3 MOMENTS', 60, 420);
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  defining.forEach((ev, i) => {
    const y = 462 + i * 44;
    ctx.fillStyle = '#34d399';
    ctx.fillText(`Y${Math.max(1, Math.ceil(ev.month / 12))}`, 60, y);
    ctx.fillStyle = '#e2e8f0';
    const title = ev.title.length > 58 ? ev.title.slice(0, 57) + '…' : ev.title;
    ctx.fillText(title, 125, y);
  });
  if (defining.length === 0) {
    ctx.fillStyle = '#64748b';
    ctx.fillText('A quiet decade — steady hands.', 60, 462);
  }

  // Footer
  ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
  ctx.fillRect(0, CARD_H - 64, CARD_W, 64);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.fillText(`Play today's challenge → ${GAME_URL.replace('https://', '')}`, 60, CARD_H - 22);
};

const ChallengeShareCard: React.FC<ChallengeShareCardProps> = ({ gameState, netWorth, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  const shareText = useMemo(() => {
    const ch = gameState.challenge;
    const outcome = gameState.isBankrupt
      ? 'I went bankrupt'
      : gameState.hasWon
        ? `I hit financial freedom in ${yearsMonths(gameState.prestige?.fastestWin || gameState.month - 1)}`
        : 'I survived the 10-year sprint';
    return `Tycoon Daily Challenge ${ch?.id}: ${outcome} — final net worth ${fmtMoney(netWorth)}. Same world, your choices: ${GAME_URL}`;
  }, [gameState, netWorth]);

  useEffect(() => {
    if (canvasRef.current) drawCard(canvasRef.current, gameState, netWorth);
    try {
      setShareSupported(typeof navigator !== 'undefined' && !!navigator.share);
    } catch {
      setShareSupported(false);
    }
  }, [gameState, netWorth]);

  const fileName = `tycoon-daily-${gameState.challenge?.id || 'run'}.png`;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = fileName;
    a.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/png'));
      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
        await navigator.share({
          files: [new File([blob], fileName, { type: 'image/png' })],
          text: shareText
        });
        return;
      }
      await navigator.share({ text: shareText, url: GAME_URL });
    } catch {
      // user cancelled or share failed — no-op
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        width={CARD_W}
        height={CARD_H}
        className="w-full max-w-2xl rounded-xl border border-slate-700 shadow-2xl"
      />
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleDownload}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-colors"
        >
          Download card
        </button>
        {shareSupported && (
          <button
            onClick={handleShare}
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
          >
            Share
          </button>
        )}
        <button
          onClick={handleCopy}
          className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
        >
          {copied ? 'Copied!' : 'Copy text'}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default ChallengeShareCard;
