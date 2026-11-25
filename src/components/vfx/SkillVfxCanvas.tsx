import React, { useEffect, useRef } from 'react';
import type { SkillVfxEvent } from '../../types/game';
import { ISO_VIEW_H, ISO_VIEW_W, squareToBoardPoint, type BoardView } from '../board/isometric';

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

/**
 * Draws the iconic tilted comic "SLASH!" (or SKAK!/SKAKMAT!) orange-gold gradient typography
 * with crisp black outline & warm comic depth matching the reference artwork.
 */
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
  const floatY = y - progress * 22;

  const clampedX = Math.max(125, Math.min(ISO_VIEW_W - 125, x));
  const clampedY = Math.max(76, Math.min(ISO_VIEW_H - 64, floatY));

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(clampedX, clampedY);
  ctx.rotate(-0.2); // Iconic slanted comic tilt!
  ctx.scale(pop, pop);

  const fontSize = isAlert ? 46 : 44;
  ctx.font = `900 italic ${fontSize}px "Archivo Black", Impact, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Deep comic drop shadow
  ctx.lineWidth = 12;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#191410';
  ctx.strokeText(text, 4, 5);

  // Outer thick black outline
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#191410';
  ctx.strokeText(text, 0, 0);

  // Fiery gold-to-orange gradient fill (persis referensi SLASH!)
  const grad = ctx.createLinearGradient(0, -24, 0, 24);
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

  // Top glossy white highlight rim
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.fillText(text, -1, -2);

  ctx.restore();
}

/**
 * Draws the sweeping curved Blue-Gold Cartoon Energy Slash Arc matching the reference!
 */
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
  ctx.translate(cx, cy - 18);
  ctx.scale(flipDir, 1);

  const startAngle = -Math.PI * 0.72;
  const endAngle = startAngle + Math.PI * 1.18 * reveal;

  // Outer Electric Cyan-Blue Sweeping Crescent
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(-8, 6, 76, startAngle, endAngle);
  ctx.strokeStyle = '#162838';
  ctx.lineWidth = 28 * fade + 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-8, 6, 76, startAngle, endAngle);
  ctx.strokeStyle = '#29D3FF';
  ctx.lineWidth = 22 * fade + 2;
  ctx.stroke();

  // Bright Sky-White Inner Trail
  ctx.beginPath();
  ctx.arc(-8, 6, 74, startAngle + 0.08, endAngle);
  ctx.strokeStyle = '#E0FBFF';
  ctx.lineWidth = 9 * fade + 1;
  ctx.stroke();

  // Fiery Golden-Orange Counter-Arc Ribbon
  ctx.beginPath();
  ctx.arc(-14, 14, 62, startAngle + 0.14, endAngle);
  ctx.strokeStyle = '#FF9C24';
  ctx.lineWidth = 14 * fade + 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(-14, 14, 60, startAngle + 0.18, endAngle);
  ctx.strokeStyle = '#FFF394';
  ctx.lineWidth = 5 * fade + 1;
  ctx.stroke();

  ctx.restore();
}

/**
 * High-DPI HTML5 Canvas 1.2s non-blocking VFX Engine aligned to the 2.5D Isometric Diorama.
 * Renders curved blue-gold energy slashes, cartoon dust clouds, unit-specific accents,
 * and slanted comic "SLASH!" / "SKAK!" / "SKAKMAT!" typography.
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

    const scaleX = width / ISO_VIEW_W;
    const scaleY = height / ISO_VIEW_H;

    const fromPt = squareToBoardPoint(event.from, flipped, boardView);
    const toPt = squareToBoardPoint(event.to, flipped, boardView);
    const flipDir = toPt.x >= fromPt.x ? 1 : -1;

    // Seed billowing cartoon dust clouds at impact base (persis referensi!)
    const dusts: DustPuff[] = [];
    const dustCount = event.isKingEscapeOrMove ? 6 : 12;
    for (let i = 0; i < dustCount; i++) {
      const angle = (Math.PI * 2 * i) / dustCount + (Math.random() - 0.5) * 0.4;
      const spd = 0.8 + Math.random() * 2.1;
      dusts.push({
        x: toPt.x + Math.cos(angle) * 14,
        y: toPt.y + Math.sin(angle) * 8 + 4,
        vx: Math.cos(angle) * spd * 1.4,
        vy: Math.sin(angle) * spd * 0.65 - 0.35,
        r: 14 + Math.random() * 14,
        color: i % 2 === 0 ? '#F2E7D3' : '#DFD2BC',
        life: 0.78 + Math.random() * 0.22,
      });
    }

    // Seed glowing blue/gold/white impact sparks
    const sparks: Spark[] = [];
    const sparkPalette = ['#38E8FF', '#FFD94A', '#FF8E2B', '#FFFFFF'];
    const sparkCount = event.pieceType === 'q' ? 24 : 16;
    for (let i = 0; i < sparkCount; i++) {
      const a = (Math.PI * 2 * i) / sparkCount + (Math.random() - 0.5) * 0.35;
      const spd = 2.2 + Math.random() * 4.2;
      sparks.push({
        x: toPt.x,
        y: toPt.y - 16,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - 1.2,
        size: 5 + Math.random() * 7,
        color: sparkPalette[i % sparkPalette.length],
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.25,
      });
    }

    const startTime = performance.now();

    const render = (now: number) => {
      const t = Math.min(1, (now - startTime) / VFX_DURATION_MS);

      ctx.save();
      ctx.scale(dpr * scaleX, dpr * scaleY);
      ctx.clearRect(0, 0, ISO_VIEW_W, ISO_VIEW_H);

      const fade = Math.max(0, 1 - t);

      // 1. Isometric Expanding Ground Shockwave Ring
      if (t < 0.75) {
        const ringP = t / 0.75;
        ctx.save();
        ctx.globalAlpha = (1 - ringP) * 0.85;
        ctx.beginPath();
        ctx.ellipse(
          toPt.x,
          toPt.y + 2,
          24 + ringP * 76,
          12 + ringP * 38,
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
        // Witch Cat / Hound Mystic Diagonal Magic Beam
        const beamP = Math.min(1, t / 0.28);
        const beamFade = t > 0.28 ? Math.max(0, 1 - (t - 0.28) / 0.5) : 1;
        const cx = fromPt.x + (toPt.x - fromPt.x) * beamP;
        const cy = fromPt.y - 24 + (toPt.y - fromPt.y) * beamP;
        ctx.save();
        ctx.globalAlpha = beamFade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(fromPt.x, fromPt.y - 24);
        ctx.lineTo(cx, cy);
        ctx.strokeStyle = event.pieceColor === 'w' ? '#C06CFF' : '#29D8FF';
        ctx.lineWidth = 14 * beamFade + 3;
        ctx.stroke();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5 * beamFade + 1;
        ctx.stroke();
        ctx.restore();
      } else if (event.pieceType === 'n' && (event.isCapture || event.isCheck)) {
        // Cat Knight / Boxer Parabolic Leap Trail
        const trailFade = Math.max(0, 1 - t * 1.45);
        if (trailFade > 0) {
          ctx.save();
          ctx.globalAlpha = trailFade;
          ctx.beginPath();
          ctx.moveTo(fromPt.x, fromPt.y - 16);
          ctx.quadraticCurveTo(
            (fromPt.x + toPt.x) / 2,
            Math.min(fromPt.y, toPt.y) - 96,
            toPt.x,
            toPt.y - 18
          );
          ctx.strokeStyle = '#FFE45E';
          ctx.lineWidth = 10 * trailFade + 2;
          ctx.setLineDash([12, 8]);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 3. Cartoon Dust Puffs billowing beneath impact point (persis referensi!)
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

      // 4. Sweeping Blue-Gold Curved Energy Slash (for all captures & checks!)
      if (!event.isKingEscapeOrMove || event.isCapture || event.isCheck) {
        drawBlueGoldSlashArc(ctx, toPt.x, toPt.y, t, flipDir);
      } else {
        // King's Roar / Bastion Aura golden concentric rings
        [0, 0.18].forEach((delay) => {
          const p = Math.max(0, Math.min(1, (t - delay) / 0.72));
          if (p <= 0 || p >= 1) return;
          ctx.save();
          ctx.globalAlpha = 1 - p;
          ctx.beginPath();
          ctx.ellipse(toPt.x, toPt.y - 6, 22 + p * 82, 11 + p * 42, 0, 0, Math.PI * 2);
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

      // 6. Iconic Slanted Comic "SLASH!" (or SKAK!! / SKAKMAT!!) Typography
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
        toPt.y - 46,
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
