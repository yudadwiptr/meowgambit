import React from 'react';

const FLOATING_PARTICLES = [
  { id: 1, top: '-4%', left: '6%', dur: '16s', delay: '0s', type: 'leaf', color: '#8AE058', size: 15 },
  { id: 2, top: '-6%', left: '24%', dur: '21s', delay: '-5s', type: 'petal', color: '#FFA8C5', size: 11 },
  { id: 3, top: '8%', left: '-4%', dur: '19s', delay: '-9s', type: 'leaf', color: '#6CC44A', size: 14 },
  { id: 4, top: '-5%', left: '48%', dur: '23s', delay: '-3s', type: 'petal', color: '#FFE57F', size: 10 },
  { id: 5, top: '18%', left: '-3%', dur: '17s', delay: '-12s', type: 'petal', color: '#FFB8D2', size: 12 },
  { id: 6, top: '-4%', left: '68%', dur: '20s', delay: '-7s', type: 'leaf', color: '#9BE868', size: 13 },
  { id: 7, top: '34%', left: '-5%', dur: '22s', delay: '-14s', type: 'leaf', color: '#7AD154', size: 15 },
  { id: 8, top: '-3%', left: '14%', dur: '25s', delay: '-17s', type: 'petal', color: '#A3DAFF', size: 10 },
  { id: 9, top: '5%', left: '38%', dur: '18s', delay: '-11s', type: 'leaf', color: '#82D95B', size: 12 },
  { id: 10, top: '-5%', left: '80%', dur: '24s', delay: '-2s', type: 'petal', color: '#FFE57F', size: 11 },
];

/** Corner lush castle garden tree cluster */
const CornerTree: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} stroke="#16291A" strokeWidth="3" strokeLinejoin="round">
    <ellipse cx="0" cy="64" rx="58" ry="20" fill="rgba(10, 26, 15, 0.35)" stroke="none" />
    <rect x="-15" y="20" width="30" height="46" rx="7" fill="#6E4427" />
    <circle cx="-42" cy="4" r="36" fill="#2F6638" />
    <circle cx="42" cy="6" r="34" fill="#2F6638" />
    <circle cx="0" cy="-30" r="44" fill="#3E7F42" />
    <circle cx="-26" cy="-16" r="35" fill="#4B9149" />
    <circle cx="26" cy="-14" r="33" fill="#418344" />
    <circle cx="0" cy="8" r="36" fill="#37733C" />
    {/* Warm sunlit canopy highlights */}
    <circle cx="-16" cy="-40" r="14" fill="#7AC75E" stroke="none" opacity="0.58" />
    <circle cx="18" cy="-28" r="10" fill="#7AC75E" stroke="none" opacity="0.48" />
  </g>
);

/** Outer wooden garden picket */
const OuterFencePost: React.FC<{ x: number; y: number; h?: number }> = ({ x, y, h = 44 }) => (
  <g stroke="#21150D" strokeWidth="2.4" strokeLinejoin="round">
    <path
      d={`M${x - 7} ${y} L${x - 7} ${y - h + 8} L${x} ${y - h} L${x + 7} ${y - h + 8} L${x + 7} ${y} Z`}
      fill="#8F5A32"
    />
    <line x1={x - 1.5} y1={y - h + 9} x2={x - 1.5} y2={y - 4} stroke="#B07447" strokeWidth="2" />
  </g>
);

/**
 * Rich 2D Castle Garden Scenery Backdrop behind the 2.5D Isometric Chess Diorama:
 * Warm cobblestone pathways, castle garden walls, outer wooden fences, lush corner trees,
 * warm diagonal sunbeams from top-left, and gentle drifting leaves & flower petals.
 */
export const GardenBackdrop: React.FC = React.memo(() => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      <svg
        viewBox="0 0 1440 810"
        preserveAspectRatio="xMidYMid slice"
        className="w-full h-full block"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="castle-lawn" cx="48%" cy="46%" r="65%">
            <stop offset="0%" stopColor="#3F704C" />
            <stop offset="52%" stopColor="#2E563D" />
            <stop offset="100%" stopColor="#1D3829" />
          </radialGradient>
          <linearGradient id="arena-sunbeams" x1="0%" y1="0%" x2="55%" y2="75%">
            <stop offset="0%" stopColor="#FFF6B8" stopOpacity="0.34" />
            <stop offset="55%" stopColor="#FFE88A" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#FFE88A" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="castle-wall-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8E867B" />
            <stop offset="100%" stopColor="#655E55" />
          </linearGradient>
        </defs>

        {/* Base Deep Castle Garden Lawn */}
        <rect width="1440" height="810" fill="url(#castle-lawn)" />

        {/* Subtle Lighter Meadow Patches */}
        <ellipse cx="320" cy="240" rx="260" ry="120" fill="#4A8252" opacity="0.28" />
        <ellipse cx="1120" cy="610" rx="280" ry="130" fill="#4A8252" opacity="0.24" />
        <ellipse cx="720" cy="430" rx="540" ry="270" fill="#3B6D47" opacity="0.35" />

        {/* Distant Castle Garden Stone Wall along top horizon */}
        <g opacity="0.88" stroke="#1E261E" strokeWidth="2.5">
          <rect x="0" y="0" width="1440" height="68" fill="url(#castle-wall-grad)" />
          {/* Castle battlements / stone coping */}
          {Array.from({ length: 18 }, (_, i) => (
            <rect
              key={`cop-${i}`}
              x={i * 84 - 10}
              y="56"
              width="78"
              height="16"
              rx="4"
              fill={i % 2 === 0 ? '#A39A8D' : '#948B7F'}
            />
          ))}
          {/* Subtle brick mortar lines */}
          <line x1="0" y1="26" x2="1440" y2="26" stroke="#4D473F" strokeWidth="1.8" opacity="0.6" />
          <line x1="0" y1="44" x2="1440" y2="44" stroke="#4D473F" strokeWidth="1.8" opacity="0.6" />
          {/* Moss patches hanging from castle wall */}
          <path d="M180 68 Q195 88 214 72 Q228 84 242 68 Z" fill="#4B8E47" stroke="#1D331E" strokeWidth="1.8" />
          <path d="M980 68 Q998 92 1020 74 Q1038 88 1054 68 Z" fill="#4B8E47" stroke="#1D331E" strokeWidth="1.8" />
        </g>

        {/* Cobblestone Garden Pathways radiating around the diorama island */}
        <g stroke="#29241E" strokeWidth="2.2" opacity="0.86">
          {/* Upper-left path curving toward center */}
          {[
            { x: 185, y: 120, rx: 32, ry: 15, rot: 14 },
            { x: 255, y: 155, rx: 34, ry: 16, rot: 16 },
            { x: 325, y: 192, rx: 30, ry: 14, rot: 12 },
            { x: 112, y: 92, rx: 28, ry: 13, rot: 10 },
            // Lower-left path
            { x: 245, y: 690, rx: 34, ry: 16, rot: -16 },
            { x: 170, y: 728, rx: 36, ry: 17, rot: -14 },
            { x: 96, y: 762, rx: 32, ry: 15, rot: -12 },
            { x: 322, y: 656, rx: 28, ry: 14, rot: -18 },
            // Upper-right path
            { x: 1255, y: 125, rx: 32, ry: 15, rot: -14 },
            { x: 1185, y: 160, rx: 34, ry: 16, rot: -16 },
            { x: 1118, y: 195, rx: 28, ry: 14, rot: -12 },
            // Lower-right path
            { x: 1140, y: 660, rx: 32, ry: 15, rot: 16 },
            { x: 1218, y: 702, rx: 36, ry: 17, rot: 14 },
            { x: 1298, y: 744, rx: 34, ry: 16, rot: 12 },
            // Bottom-center stepping stones
            { x: 645, y: 758, rx: 32, ry: 14, rot: -4 },
            { x: 728, y: 768, rx: 36, ry: 15, rot: 2 },
            { x: 808, y: 756, rx: 30, ry: 13, rot: 6 },
          ].map((stone, idx) => (
            <g key={`cob-${idx}`} transform={`translate(${stone.x}, ${stone.y}) rotate(${stone.rot})`}>
              <ellipse cx="1" cy="3" rx={stone.rx} ry={stone.ry} fill="#4B463F" stroke="none" />
              <ellipse
                cx="0"
                cy="0"
                rx={stone.rx}
                ry={stone.ry}
                fill={idx % 2 === 0 ? '#A89F8F' : '#968D7E'}
              />
              <ellipse
                cx={-stone.rx * 0.25}
                cy={-stone.ry * 0.28}
                rx={stone.rx * 0.35}
                ry={stone.ry * 0.24}
                fill="rgba(255,250,235,0.28)"
                stroke="none"
              />
            </g>
          ))}
        </g>

        {/* Outer Wooden Garden Fences flanking left and right edges */}
        <g opacity="0.9">
          <line x1="18" y1="335" x2="18" y2="545" stroke="#6E4424" strokeWidth="7" strokeLinecap="round" />
          {[350, 400, 450, 500, 550].map((py, i) => (
            <OuterFencePost key={`ofl-${i}`} x={26} y={py} h={38} />
          ))}

          <line x1="1422" y1="335" x2="1422" y2="545" stroke="#6E4424" strokeWidth="7" strokeLinecap="round" />
          {[350, 400, 450, 500, 550].map((py, i) => (
            <OuterFencePost key={`ofr-${i}`} x={1414} y={py} h={38} />
          ))}
        </g>

        {/* Lush Corner Trees Framing the Arena (Keeping Center & HUD Readable) */}
        <CornerTree x={52} y={180} scale={1.35} />
        <CornerTree x={1395} y={185} scale={1.38} />
        <CornerTree x={48} y={670} scale={1.3} />
        <CornerTree x={1395} y={665} scale={1.25} />

        {/* Scattered Wildflowers & Grass Tufts on Outer Lawn */}
        {[
          { x: 165, y: 295, c: '#FFA8C5' },
          { x: 205, y: 580, c: '#FFE57F' },
          { x: 120, y: 485, c: '#8CD4FF' },
          { x: 1285, y: 295, c: '#FFE57F' },
          { x: 1265, y: 555, c: '#FFA8C5' },
          { x: 1320, y: 470, c: '#8CD4FF' },
          { x: 465, y: 745, c: '#FFA8C5' },
          { x: 955, y: 748, c: '#FFE57F' },
        ].map((fl, i) => (
          <g key={`oflw-${i}`} transform={`translate(${fl.x}, ${fl.y})`} opacity="0.88">
            <circle cx="-4" cy="0" r="3.4" fill={fl.c} stroke="#1B1F1B" strokeWidth="1.2" />
            <circle cx="4" cy="0" r="3.4" fill={fl.c} stroke="#1B1F1B" strokeWidth="1.2" />
            <circle cx="0" cy="-4" r="3.4" fill={fl.c} stroke="#1B1F1B" strokeWidth="1.2" />
            <circle cx="0" cy="4" r="3.4" fill={fl.c} stroke="#1B1F1B" strokeWidth="1.2" />
            <circle cx="0" cy="0" r="2.4" fill="#FFE259" />
          </g>
        ))}

        {/* Warm Diagonal Castle Courtyard Sunbeams from Top-Left */}
        <polygon points="0,0 480,0 1040,680 180,810 0,460" fill="url(#arena-sunbeams)" />
        <polygon points="220,0 440,0 920,560 720,620" fill="url(#arena-sunbeams)" opacity="0.55" />
      </svg>

      {/* Ambient Drifting Green Leaves & Flower Petals */}
      {FLOATING_PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute animate-leaf-drift"
          style={
            {
              top: p.top,
              left: p.left,
              '--drift-dur': p.dur,
              '--drift-delay': p.delay,
            } as React.CSSProperties
          }
        >
          {p.type === 'leaf' ? (
            <svg width={p.size} height={p.size} viewBox="0 0 20 20">
              <path
                d="M3 16 C4 6, 12 2, 18 3 C17 11, 12 17, 3 16 Z"
                fill={p.color}
                stroke="#1E3820"
                strokeWidth="1.4"
              />
              <path d="M4 15 Q10 10 16 4" stroke="#2D5728" strokeWidth="1" fill="none" />
            </svg>
          ) : (
            <svg width={p.size} height={p.size} viewBox="0 0 16 16">
              <ellipse
                cx="8"
                cy="8"
                rx="6"
                ry="4"
                transform="rotate(-25 8 8)"
                fill={p.color}
                stroke="#3A222B"
                strokeWidth="1.1"
              />
            </svg>
          )}
        </div>
      ))}
    </div>
  );
});

GardenBackdrop.displayName = 'GardenBackdrop';
