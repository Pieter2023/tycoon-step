import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameState } from '../types';
import { DIFFICULTY_SETTINGS } from '../constants';

// Shareable end-of-run summary card. Originally built for the Daily
// Challenge; normal games (no gameState.challenge) reuse it on win,
// bankruptcy, or whenever the player opens "Run summary".
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

// Wordle-style trajectory: an emoji bar chart of the net-worth curve that
// survives being pasted into a tweet, a group chat, or a Discord. This is what
// actually travels — a downloadable PNG doesn't. Reveals your shape/score, not
// the "answer", which is exactly the daily-challenge sharing loop.
const SPARK_BLOCKS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
const sparkline = (history: { value: number }[] | undefined): string => {
  const vals = (history || []).map(h => h.value);
  if (vals.length < 2) return '';
  const N = Math.min(12, vals.length);
  const step = (vals.length - 1) / (N - 1);
  const sampled = Array.from({ length: N }, (_, i) => vals[Math.round(i * step)]);
  const min = Math.min(...sampled);
  const max = Math.max(...sampled);
  const span = max - min || 1;
  return sampled
    .map(v => SPARK_BLOCKS[Math.max(0, Math.min(SPARK_BLOCKS.length - 1, Math.round(((v - min) / span) * (SPARK_BLOCKS.length - 1))))])
    .join('');
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

/**
 * Chronological {month, title} list for the card. Challenge runs record
 * challengeEvents purpose-built for this; normal games fall back to the
 * event feed (newest-first, capped at 50) minus routine noise.
 */
export const pickRunEvents = (gameState: GameState): { month: number; title: string }[] => {
  if (gameState.challenge) return gameState.challengeEvents || [];
  return (gameState.events || [])
    .filter(e => e.type !== 'NEWS' && e.type !== 'DECISION' && e.type !== 'WARNING')
    .map(e => ({ month: e.month, title: e.title }))
    .sort((a, b) => a.month - b.month);
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
  const difficultyLabel = DIFFICULTY_SETTINGS[gameState.difficulty as keyof typeof DIFFICULTY_SETTINGS]?.label || '';
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.fillText(ch ? 'TYCOON · DAILY CHALLENGE' : 'TYCOON · FREEDOM RUN', 60, 78);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  ctx.fillText(ch ? ch.id : difficultyLabel, 60, 116);

  // Character (right-aligned header)
  const charName = gameState.character?.name || 'Player';
  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '26px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${gameState.character?.avatarEmoji || ''}  ${charName}`, CARD_W - 60, 78);
  ctx.textAlign = 'left';

  // Outcome line
  const months = ch ? Math.min(gameState.month - 1, ch.targetMonths) : Math.max(1, gameState.month - 1);
  let outcome: string;
  let outcomeColor = '#34d399';
  if (gameState.isBankrupt) {
    outcome = `Went bankrupt after ${yearsMonths(months)}`;
    outcomeColor = '#f87171';
  } else if (gameState.hasWon) {
    const winMonth = gameState.prestige?.fastestWin || months;
    outcome = `Financially free in ${yearsMonths(winMonth)}`;
  } else if (ch) {
    outcome = `Survived the 10-year sprint`;
    outcomeColor = '#facc15';
  } else {
    outcome = `Still building after ${yearsMonths(months)}`;
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
  const runOver = !!ch || gameState.hasWon || gameState.isBankrupt;
  ctx.fillText(runOver ? 'FINAL NET WORTH' : 'NET WORTH SO FAR', 62, 316);

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
    // Normal games only keep the last 60 months of history; say what the curve shows.
    const chartLabel = ch
      ? 'NET WORTH OVER 10 YEARS'
      : history.length < months
        ? `NET WORTH — LAST ${yearsMonths(history.length).toUpperCase()}`
        : `NET WORTH OVER ${yearsMonths(months).toUpperCase()}`;
    ctx.fillText(chartLabel, chartX, chartY + chartH + 34);
  }

  // Defining events
  const defining = pickDefiningEvents(pickRunEvents(gameState));
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
    ctx.fillText(ch ? 'A quiet decade — steady hands.' : 'A quiet run — steady hands.', 60, 462);
  }

  // Footer
  ctx.fillStyle = 'rgba(52, 211, 153, 0.15)';
  ctx.fillRect(0, CARD_H - 64, CARD_W, 64);
  ctx.fillStyle = '#34d399';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  const footer = ch
    ? `Play today's challenge → ${GAME_URL.replace('https://', '')}`
    : `Think you can do it faster? → ${GAME_URL.replace('https://', '')}`;
  ctx.fillText(footer, 60, CARD_H - 22);
};

const ChallengeShareCard: React.FC<ChallengeShareCardProps> = ({ gameState, netWorth, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [shareSupported, setShareSupported] = useState(false);

  const shareText = useMemo(() => {
    const ch = gameState.challenge;
    const spark = sparkline(gameState.netWorthHistory);
    const charName = gameState.character?.name || 'Player';
    const outcome = gameState.isBankrupt
      ? 'Went bankrupt 💥'
      : gameState.hasWon
        ? `Financially FREE in ${yearsMonths(gameState.prestige?.fastestWin || gameState.month - 1)} 🏆`
        : ch
          ? 'Survived the 10-year sprint'
          : `${yearsMonths(Math.max(1, gameState.month - 1))} into the climb`;
    if (ch) {
      return [
        `Tycoon Daily ${ch.id} 💰`,
        spark,
        `${charName} → ${fmtMoney(netWorth)}`,
        outcome,
        `Same world, your call — beat me 👉 ${GAME_URL}`,
      ].filter(Boolean).join('\n');
    }
    return [
      `Tycoon 💰 ${outcome}`,
      spark,
      `Net worth ${fmtMoney(netWorth)}`,
      `Think you can do it faster? 👉 ${GAME_URL}`,
    ].filter(Boolean).join('\n');
  }, [gameState, netWorth]);

  useEffect(() => {
    if (canvasRef.current) drawCard(canvasRef.current, gameState, netWorth);
    try {
      setShareSupported(typeof navigator !== 'undefined' && !!navigator.share);
    } catch {
      setShareSupported(false);
    }
  }, [gameState, netWorth]);

  const fileName = gameState.challenge
    ? `tycoon-daily-${gameState.challenge.id}.png`
    : 'tycoon-run-summary.png';

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
          onClick={handleCopy}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold transition-colors"
        >
          {copied ? 'Copied — now paste it!' : 'Copy result'}
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
          onClick={handleDownload}
          className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold transition-colors"
        >
          Save image
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
