import React, { useEffect, useRef } from 'react';
import type { SkillVfxEvent } from '../../types/game';
import { ARENA_H, ARENA_W, squareToBoardPoint, type BoardView } from '../board/isometric';

interface SkillVfxCanvasProps {
  event: SkillVfxEvent | null;
  flipped: boolean;
  boardView?: BoardView;
}

interface DustPuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  life: number;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  vRot: number;
}

const VFX_DURATION_MS = 1200;

function drawSlantedComicText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  progress: number,
  isAlert: boolean
) {
  const pop =
    progress < 0.16
      ? 0.28 + (progress / 0.16) * 0.96
      : progress < 0.28
        ? 1.24 - ((progress - 0.16) / 0.12) * 0.24
        : 1;
  const alpha = progress > 0.76 ? Math.max(0, 1 - (progress - 0.76) / 0.24) : 1;
  const floatY = y - progress * 24;

  const clampedX = Math.max(180, Math.min(ARENA_W - 180, x));
  const clampedY = Math.max(90, Math.min(ARENA_H - 72, floatY));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(clampedX, clampedY);
  ctx.rotate(-0.2);
  ctx.scale(pop, pop);

  const fontSize = isAlert ? 50 : 48;
  ctx.font = `900 italic ${fontSize}px "Archivo Black", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.lineWidth = 13;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#191410';
  ctx.strokeText(text, 4, 5);

  ctx.lineWidth = 10;
  ctx.strokeStyle = '#191410';
  ctx.strokeText(text, 0, 0);

  const grad = ctx.createLinearGradient(0, -26, 0, 26);
  if (isAlert) {
    grad.addColorStop(0, '#FFF68F');
    grad.addColorStop(0.5, '#FF8A2B');
    grad.addColorStop(1, '#E62E2D');
  } else {
    grad.addColorStop(0, '#FFF78C');
    grad.addColorStop(0.52, '#FFB627');
    grad.addColorStop(1, '#F25C19');
  }
  ctx.fillStyle = grad;
  ctx.fillText(text, 0, 0);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText(text, -1, -2);

  ctx.restore();
}

function drawBlueGoldSlashArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  t: number,
  flipDir: number
) {
  const reveal = Math.min(1, t / 0.28);
  const fade = t > 0.35 ? Math.max(0, 1 - (t - 0.35) / 0.55) : 1;
  if (fade <= 0.01) return;

  ctx.save();
  ctx.globalAlpha = fade;
  ctx.translate(cx, cy - 20);
  ctx.scale(flipDir, 1);

  const startAngle = -Math.PI * 0.72;
  const endAngle = startAngle + Math.PI * 1.18 * reveal;

  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-8, 6, 82, startAngle, endAngle);
  ctx.strokeStyle = '#162838';
  ctx.lineWidth = 30 * fade + 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-8, 6, 82, startAngle, endAngle);
  ctx.strokeStyle = '#29D3FF';
  ctx.lineWidth = 23 * fade + 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-8, 6, 80, startAngle + 0.08, endAngle);
  ctx.strokeStyle = '#E0FBFF';
  ctx.lineWidth = 10 * fade + 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-14, 15, 66, startAngle + 0.14, endAngle);
  ctx.strokeStyle = '#FF9C24';
  ctx.lineWidth = 15 * fade + 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-14, 15, 64, startAngle + 0.18, endAngle);
  ctx.strokeStyle = '#FFF394';
  ctx.lineWidth = 5 * fade + 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * High-DPI HTML5 Canvas 1.2s non-blocking VFX Engine mounted inside the exact same
 * fixed-aspect stage container as /arena-bg.png and the 8x8 SVG polygon overlay,
 * guaranteeing 1:1 pixel alignment at every viewport size.
 */
export const SkillVfxCanvas: React.FC<SkillVfxCanvasProps> = ({
  event,
  flipped,
  boardView = 'iso',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!event) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    // Since canvas sits inside the exact 1456x720 aspect-locked stage container,
    // scaleX === scaleY directly!
    const scaleX = width / ARENA_W;
    const scaleY = height / ARENA_H;

    const fromPt = squareToBoardPoint(event.from, flipped, boardView);
    const toPt = squareToBoardPoint(event.to, flipped, boardView);
    const flipDir = toPt.x >= fromPt.x ? 1 : -1;

    const dusts: DustPuff[] = [];
    const dustCount = event.isKingEscapeOrMove ? 6 : 12;
    for (let i = 0; i < dustCount; i++) {
      const angle = (Math.PI * 2 * i) / dustCount + (Math.random() - 0.5) * 0.4;
      const spd = 0.9 + Math.random() * 2.2;
      dusts.push({
        x: toPt.x + Math.cos(angle) * 16,
        y: toPt.y + Math.sin(angle) * 9 + 4,
        vx: Math.cos(angle) * spd * 1.4,
        vy: Math.sin(angle) * spd * 0.65 - 0.35,
        r: 15 + Math.random() * 14,
        color: i % 2 === 0 ? '#F2E7D3' : '#DFD2BC',
        life: 0.78 + Math.random() * 0.22,
      });
    }

    const sparks: Spark[] = [];
    const sparkPalette = ['#38E8FF', '#FFD94A', '#FF8E2B', '#FFFFFF'];
    const sparkCount = event.pieceType === 'q' ? 24 : 16;
    for (let i = 0; i < sparkCount; i++) {
      const a = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.35;
      const spd = 2.4 + Math.random() * 4.4;
      sparks.push({
        x: toPt.x,
        y: toPt.y - 18,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 1.2,
        size: 5.5 + Math.random() * 7.5,
        color: sparkPalette[i % sparkPalette.length],
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.25,
      });
    }

    const startTime = performance.now();

    const render = (now: number) => {
      const t = Math.min(1, (now - startTime) / VFX_DURATION_MS);

      ctx.save();
      ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);
      ctx.clearRect(0, 0, ARENA_W, ARENA_H);

      const fade = Math.max(0, 1 - t);

      // 1. Expanding Ground Shockwave Ring
      if (t < 0.75) {
        const ringP = t / 0.75;
        ctx.save();
        ctx.globalAlpha = (1 - ringP) * 0.85;
        ctx.beginPath();
        ctx.ellipse(
          toPt.x,
          toPt.y + 2,
          26 + ringP * 82,
          13 + ringP * 42,
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = event.isKingEscapeOrMove ? '#FFE052' : '#38E8FF';
        ctx.lineWidth = 6 * (1 - ringP) + 2;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Unit-Specific Beam / Leap Accent
      if (event.pieceType === 'b' && (event.isCapture || event.isCheck)) {
        const beamP = Math.min(1, t / 0.28);
        const beamFade = t > 0.28 ? Math.max(0, 1 - (t - 0.28) / 0.5) : 1;
        const cx = fromPt.x + (toPt.x - fromPt.x) * beamP;
        const cy = fromPt.y - 26 + (toPt.y - fromPt.y) * beamP;
        ctx.save();
        ctx.globalAlpha = beamFade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(fromPt.x, fromPt.y - 26);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = event.pieceColor === 'w' ? '#C06CFF' : '#29D8FF';
        ctx.lineWidth = 15 * beamFade + 3;
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5 * beamFade + 1;
        ctx.stroke();
        ctx.restore();
      } else if (event.pieceType === 'n' && (event.isCapture || event.isCheck)) {
        const trailFade = Math.max(0, 1 - t * 1.45);
        if (trailFade > 0) {
          ctx.save();
          ctx.globalAlpha = trailFade;
          ctx.beginPath();
          ctx.moveTo(fromPt.x, fromPt.y - 18);
          ctx.quadraticCurveTo(
            (fromPt.x + toPt.x) / 2,
            Math.min(fromPt.y, toPt.y) - 102,
            toPt.x,
            toPt.y - 20
          );
          ctx.strokeStyle = '#FFE45E';
          ctx.lineWidth = 11 * trailFade + 2;
          ctx.setLineDash([12, 8]);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Cartoon Dust Puffs
      dusts.forEach((d) => {
        d.x += d.vx;
        d.y += d.vy;
        d.vx *= 0.93;
        d.vy *= 0.93;
        const pAlpha = Math.max(0, fade * d.life);
        if (pAlpha <= 0.03) return;
        const radius = d.r * (0.75 + t * 0.65);

        ctx.save();
        ctx.globalAlpha = pAlpha;
        ctx.beginPath();
        ctx.arc(d.x, d.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = '#3B3026';
        ctx.stroke();
        ctx.restore();
      });

      // 4. Sweeping Blue-Gold Curved Energy Slash
      if (!event.isKingEscapeOrMove || event.isCapture || event.isCheck) {
        drawBlueGoldSlashArc(ctx, toPt.x, toPt.y, t, flipDir);
      } else {
        [0, 0.18].forEach((delay) => {
          const p = Math.max(0, Math.min(1, (t - delay) / 0.72));
          if (p <= 0 || p >= 1) return;
          ctx.save();
          ctx.globalAlpha = 1 - p;
          ctx.beginPath();
          ctx.ellipse(toPt.x, toPt.y - 6, 24 + p * 86, 12 + p * 44, 0, 0, Math.PI * 2);
          ctx.strokeStyle = event.pieceColor === 'w' ? '#FFD93D' : '#38E8FF';
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.restore();
        });
      }

      // 5. Flying Energy Sparks
      if (!event.isKingEscapeOrMove) {
        sparks.forEach((s) => {
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.08;
          s.vx *= 0.96;
          s.rot += s.vRot;
          if (fade <= 0.03) return;

          ctx.save();
          ctx.globalAlpha = fade;
          ctx.translate(s.x, s.y);
          ctx.rotate(s.rot);
          ctx.fillStyle = s.color;
          ctx.strokeStyle = '#1D1815';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(0, -s.size);
          ctx.lineTo(s.size * 0.35, -s.size * 0.35);
          ctx.lineTo(s.size, 0);
          ctx.lineTo(s.size * 0.35, s.size * 0.35);
          ctx.lineTo(0, s.size);
          ctx.lineTo(-s.size * 0.35, s.size * 0.35);
          ctx.lineTo(-s.size, 0);
          ctx.lineTo(-s.size * 0.35, -s.size * 0.35);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        });
      }

      // 6. Slanted Comic "SLASH!" / "SKAK!!" / "SKAKMAT!!" Typography
      const mainLabel = event.isCheckmate
        ? event.checkmateLabel
        : event.isCheck
          ? event.checkLabel
          : event.isKingEscapeOrMove
            ? event.callout
            : 'SLASH!';
      drawSlantedComicText(
        ctx,
        mainLabel,
        toPt.x + 8,
        toPt.y - 50,
        t,
        event.isCheck || event.isCheckmate
      );

      ctx.restore();

      if (t < 1) {
        rafRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [event, flipped, boardView]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
      aria-hidden="true"
    />
  );
};
