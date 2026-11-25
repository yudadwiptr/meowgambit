import React from 'react';
import type { Color, PieceSymbol } from 'chess.js';

interface AnimalPieceProps {
  color: Color;
  type: PieceSymbol;
  className?: string;
  showBadge?: boolean;
  showShadow?: boolean;
}

const ROLE_LABELS: Record<PieceSymbol, string> = {
  p: 'P',
  n: 'N',
  b: 'B',
  r: 'R',
  q: 'Q',
  k: 'K',
};

/**
 * 12 Handcrafted 2D Full-Body Standing Chibi Cartoon Sprites for MeowGambit.
 * Designed to stand upright on the 2.5D Isometric Garden Diorama with soft ground shadows,
 * crisp cartoon ink outlines (#1C1714), and warm garden-harmonized palettes matching the reference.
 */
export const AnimalPiece: React.FC<AnimalPieceProps> = React.memo(
  ({ color, type, className = 'w-full h-full', showBadge = false, showShadow = true }) => {
    const isCat = color === 'w';
    const ink = '#1C1714';

    return (
      <svg
        viewBox="0 0 110 128"
        className={`select-none pointer-events-none overflow-visible ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        aria-label={`${isCat ? 'Cat Kingdom' : 'Dog Guard'} ${type.toUpperCase()}`}
      >
        {/* Soft dark oval shadow under feet so each sprite feels planted on the grass */}
        {showShadow && (
          <ellipse cx="55" cy="116" rx="28" ry="8.5" fill="rgba(16, 36, 22, 0.42)" />
        )}

        {/* ============================================================
            TIM PUTIH — KERAJAAN KUCING (CAT KINGDOM)
           ============================================================ */}

        {/* W-P: Anak Kucing (Pion) — Topi kayu coklat & tunik coklat hangat */}
        {isCat && type === 'p' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Curled little tail */}
            <path d="M34 99 C20 96, 17 82, 26 78" fill="none" strokeWidth="5.2" />
            <path d="M34 99 C20 96, 17 82, 26 78" fill="none" stroke="#D8B388" strokeWidth="2.4" />
            {/* Little wooden spear/sword on right */}
            <line x1="78" y1="68" x2="82" y2="108" stroke="#6E4728" strokeWidth="3.2" />
            <polygon points="78,56 73,69 83,69" fill="#DCE4EA" strokeWidth="2" />
            {/* Feet & Legs */}
            <ellipse cx="45" cy="113" rx="6.5" ry="4.5" fill="#7D5233" />
            <ellipse cx="64" cy="113" rx="6.5" ry="4.5" fill="#7D5233" />
            {/* Chibi Tunic Body */}
            <path d="M39 76 L35 107 Q55 113 74 107 L70 76 Z" fill="#9E6B43" />
            <rect x="37" y="92" width="35" height="6" rx="2" fill="#5C3A21" />
            <rect x="51" y="91" width="8" height="8" rx="1.5" fill="#F2C94C" strokeWidth="1.8" />
            {/* Little Paws */}
            <circle cx="35" cy="89" r="5" fill="#F6E5CF" />
            <circle cx="74" cy="88" r="5" fill="#F6E5CF" />
            {/* Head */}
            <ellipse cx="55" cy="59" rx="21" ry="18" fill="#F6E5CF" />
            {/* Wooden Squire Cap Helmet */}
            <path d="M33 52 C33 31, 77 31, 77 52 Z" fill="#8C5932" />
            <path d="M30 51 Q55 57 80 51 L78 56 Q55 62 32 56 Z" fill="#6E4323" />
            <path d="M44 37 L44 52 M55 34 L55 53 M66 37 L66 52" stroke="#533118" strokeWidth="1.8" />
            {/* Ears peeking out */}
            <polygon points="34,47 28,33 43,40" fill="#D8B388" />
            <polygon points="76,47 82,33 67,40" fill="#D8B388" />
            {/* Cute Eyes & Rosy Cheeks */}
            <circle cx="46" cy="61" r="3.2" fill={ink} />
            <circle cx="47" cy="59.8" r="1.1" fill="#FFFFFF" stroke="none" />
            <circle cx="64" cy="61" r="3.2" fill={ink} />
            <circle cx="65" cy="59.8" r="1.1" fill="#FFFFFF" stroke="none" />
            <ellipse cx="40" cy="65" rx="3.2" ry="1.8" fill="#F5A3A3" stroke="none" opacity="0.7" />
            <ellipse cx="70" cy="65" rx="3.2" ry="1.8" fill="#F5A3A3" stroke="none" opacity="0.7" />
            <polygon points="53,65 57,65 55,67.5" fill="#E07A7A" strokeWidth="1.4" />
            <path d="M50 69.5 Q55 72.5 60 69.5" fill="none" strokeWidth="2" />
          </g>
        )}

        {/* W-N: Kucing Ksatria (Kuda) — Ksatria kucing berzirah + syal merah menunggang kuda poni putih! */}
        {isCat && type === 'n' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Flowing Crimson Scarf trailing behind */}
            <path d="M46 58 C26 52, 16 58, 10 50 C17 65, 30 67, 45 64 Z" fill="#D9383A" />
            {/* White Pony Tail */}
            <path d="M26 90 C15 88, 12 99, 20 105 C24 100, 26 96, 30 94 Z" fill="#F7F4EC" />
            {/* Pony Legs */}
            <path d="M35 98 L31 114 L38 114 L42 100 Z" fill="#EFEBE0" />
            <path d="M48 100 L47 115 L54 115 L55 100 Z" fill="#FFFDF8" />
            <path d="M68 98 L71 114 L78 114 L74 98 Z" fill="#EFEBE0" />
            <path d="M77 94 L87 107 L92 103 L82 90 Z" fill="#FFFDF8" />
            {/* Pony Body + Neck + Head */}
            <ellipse cx="56" cy="91" rx="26" ry="13" fill="#FFFDF8" />
            <path d="M71 84 C77 72, 87 68, 93 74 C98 80, 92 89, 83 89 L75 94 Z" fill="#FFFDF8" />
            {/* Pony Ear & Eye & Saddle */}
            <polygon points="82,72 86,62 90,71" fill="#FFFDF8" />
            <circle cx="88" cy="77" r="2" fill={ink} />
            <path d="M44 82 Q56 88 68 82 L67 93 Q56 97 45 93 Z" fill="#C93B3B" />
            {/* Cat Knight Armored Torso */}
            <path d="M45 62 L42 84 L68 84 L65 62 Z" fill="#C5D0DA" />
            <path d="M45 62 Q55 68 65 62 L66 68 Q55 74 44 68 Z" fill="#D9383A" />
            {/* Red Helmet Plume */}
            <path d="M51 24 C39 14, 24 22, 27 34 C35 29, 43 30, 50 32 Z" fill="#D9383A" />
            {/* Knight Helmet & Cat Face */}
            <ellipse cx="56" cy="45" rx="18" ry="16" fill="#FFF8EE" />
            <path d="M37 44 C37 25, 75 25, 75 44 L71 46 Q56 38 41 46 Z" fill="#B8C4CF" />
            <line x1="56" y1="27" x2="56" y2="41" stroke="#7A8996" strokeWidth="2.2" />
            {/* Cute Fierce Eyes */}
            <circle cx="49" cy="48" r="2.8" fill={ink} />
            <circle cx="50" cy="47" r="1" fill="#FFFFFF" stroke="none" />
            <circle cx="63" cy="48" r="2.8" fill={ink} />
            <circle cx="64" cy="47" r="1" fill="#FFFFFF" stroke="none" />
            <polygon points="54,52 58,52 56,54.5" fill="#E07A7A" strokeWidth="1.4" />
            {/* Sword held forward */}
            <path d="M67 73 L91 58 L95 62 L71 77 Z" fill="#E6EEF5" />
            <line x1="65" y1="70" x2="73" y2="79" stroke="#F2C94C" strokeWidth="3.5" />
          </g>
        )}

        {/* W-R: Kucing Perisai (Benteng) — Kucing putih zirah + perisai cakar + pedang */}
        {isCat && type === 'r' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Sword on left */}
            <path d="M23 58 L28 96 L33 95 L29 58 L26 50 Z" fill="#E2EBF2" />
            <line x1="21" y1="88" x2="35" y2="87" stroke="#D9A73E" strokeWidth="3.5" />
            {/* Feet */}
            <ellipse cx="44" cy="113" rx="7" ry="4.5" fill="#8C99A6" />
            <ellipse cx="64" cy="113" rx="7" ry="4.5" fill="#8C99A6" />
            {/* Armored Cat Body */}
            <path d="M35 72 L32 108 L75 108 L72 72 Z" fill="#C4CFD9" />
            <path d="M40 74 Q54 82 68 74 L68 81 Q54 88 40 81 Z" fill="#D94545" />
            {/* Cat Ears */}
            <polygon points="36,42 30,22 48,34" fill="#FFFDF8" />
            <polygon points="37,38 34,28 44,35" fill="#F4B2B8" strokeWidth="1.5" />
            <polygon points="72,42 78,22 60,34" fill="#FFFDF8" />
            <polygon points="71,38 74,28 64,35" fill="#F4B2B8" strokeWidth="1.5" />
            {/* Battlement Iron Circlet */}
            <path d="M38 38 L38 28 L46 28 L46 33 L51 33 L51 27 L57 27 L57 33 L62 33 L62 28 L70 28 L70 38 Z" fill="#A9B7C4" />
            {/* White Cat Head */}
            <ellipse cx="54" cy="54" rx="20" ry="17" fill="#FFFDF8" />
            <circle cx="46" cy="55" r="3" fill={ink} />
            <circle cx="47" cy="53.8" r="1" fill="#FFFFFF" stroke="none" />
            <circle cx="62" cy="55" r="3" fill={ink} />
            <circle cx="63" cy="53.8" r="1" fill="#FFFFFF" stroke="none" />
            <polygon points="52,59 56,59 54,61.5" fill="#E07A7A" strokeWidth="1.4" />
            <path d="M49 63 Q54 66 59 63" fill="none" strokeWidth="2" />
            {/* Big Front Knight Shield with Paw Crest */}
            <path d="M55 75 L88 73 L85 102 L71 113 L57 102 Z" fill="#B5C3CF" />
            <path d="M60 79 L83 78 L81 99 L71 107 L61 99 Z" fill="#8A6343" strokeWidth="1.8" />
            <circle cx="71" cy="94" r="4.5" fill="#F5D042" strokeWidth="1.6" />
            <circle cx="66" cy="87" r="2.2" fill="#F5D042" strokeWidth="1.3" />
            <circle cx="71" cy="85" r="2.2" fill="#F5D042" strokeWidth="1.3" />
            <circle cx="76" cy="87" r="2.2" fill="#F5D042" strokeWidth="1.3" />
          </g>
        )}

        {/* W-B: Penyihir Kucing (Gajah) — Topi penyihir ungu runcing, jubah ungu, tongkat kristal */}
        {isCat && type === 'b' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Magic Staff */}
            <line x1="84" y1="54" x2="79" y2="113" stroke="#6E4427" strokeWidth="4" />
            <polygon points="84,41 91,50 84,59 77,50" fill="#F582D8" />
            <circle cx="83" cy="48" r="2" fill="#FFFFFF" stroke="none" />
            {/* Little Feet */}
            <ellipse cx="45" cy="113" rx="6" ry="4" fill="#4B306E" />
            <ellipse cx="63" cy="113" rx="6" ry="4" fill="#4B306E" />
            {/* Purple Wizard Robe */}
            <path d="M37 74 L29 110 Q54 116 78 110 L70 74 Z" fill="#7D4FB8" />
            <path d="M46 76 L54 111 L62 76 Z" fill="#5D3791" strokeWidth="1.8" />
            <path d="M35 76 Q54 85 73 76 L71 83 Q54 91 37 83 Z" fill="#F2C94C" />
            {/* Little Paws */}
            <circle cx="34" cy="88" r="5" fill="#D5C4EB" />
            <circle cx="76" cy="86" r="5" fill="#D5C4EB" />
            {/* Soft Lavender Cat Head */}
            <ellipse cx="54" cy="59" rx="19" ry="16" fill="#D5C4EB" />
            {/* Ears peeking under hat */}
            <polygon points="34,53 28,43 41,47" fill="#D5C4EB" />
            <polygon points="74,53 80,43 67,47" fill="#D5C4EB" />
            {/* Pointed Purple Witch Hat */}
            <ellipse cx="54" cy="47" rx="28" ry="7" fill="#6F41A8" />
            <path d="M36 46 L50 14 L67 24 L61 28 L72 46 Z" fill="#7D4FB8" />
            <path d="M38 42 Q54 47 70 42 L71 46 Q54 51 37 46 Z" fill="#F2C94C" />
            {/* Cute Mystic Eyes */}
            <circle cx="46" cy="60" r="3.2" fill={ink} />
            <circle cx="47" cy="58.8" r="1.2" fill="#FFFFFF" stroke="none" />
            <circle cx="62" cy="60" r="3.2" fill={ink} />
            <circle cx="63" cy="58.8" r="1.2" fill="#FFFFFF" stroke="none" />
            <polygon points="52,64 56,64 54,66.5" fill="#E38CB5" strokeWidth="1.4" />
            <path d="M49 68.5 Q54 71.5 59 68.5" fill="none" strokeWidth="2" />
          </g>
        )}

        {/* W-Q: Ratu Angora (Menteri) — Angora putih elegan, jubah merah-emas, mahkota & tongkat */}
        {isCat && type === 'q' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Fluffy White Tail */}
            <path d="M33 102 C14 97, 13 78, 26 74 C31 74, 32 82, 27 86" fill="#FFFDF8" />
            {/* Royal Scepter */}
            <line x1="84" y1="48" x2="80" y2="112" stroke="#E0AD2B" strokeWidth="3.8" />
            <circle cx="84" cy="43" r="7" fill="#5CE1FF" />
            <circle cx="82" cy="41" r="2.2" fill="#FFFFFF" stroke="none" />
            {/* Royal Crimson & White Gown */}
            <path d="M35 72 L26 112 Q54 118 81 112 L72 72 Z" fill="#D9455F" />
            <path d="M43 74 L39 113 L68 113 L64 74 Z" fill="#FFFDF8" />
            <path d="M36 73 Q54 84 72 73" fill="#FFFDF8" />
            <polygon points="54,80 59,87 54,94 49,87" fill="#5CE1FF" strokeWidth="1.8" />
            {/* Cat Ears */}
            <polygon points="35,43 29,23 47,34" fill="#FFFDF8" />
            <polygon points="36,39 33,29 43,35" fill="#F7B3C2" strokeWidth="1.4" />
            <polygon points="73,43 79,23 61,34" fill="#FFFDF8" />
            <polygon points="72,39 75,29 65,35" fill="#F7B3C2" strokeWidth="1.4" />
            {/* Golden Queen Tiara */}
            <path d="M38 36 L36 21 L46 29 L54 16 L62 29 L72 21 L70 36 Z" fill="#F5C83B" />
            <circle cx="54" cy="16" r="3" fill="#5CE1FF" />
            {/* Head */}
            <ellipse cx="54" cy="54" rx="20" ry="17" fill="#FFFDF8" />
            <circle cx="46" cy="55" r="3.2" fill={ink} />
            <circle cx="47" cy="53.8" r="1.2" fill="#FFFFFF" stroke="none" />
            <circle cx="62" cy="55" r="3.2" fill={ink} />
            <circle cx="63" cy="53.8" r="1.2" fill="#FFFFFF" stroke="none" />
            <polygon points="52,59 56,59 54,61.5" fill="#E87A90" strokeWidth="1.4" />
            <path d="M49 63.5 Q54 66.5 59 63.5" fill="none" strokeWidth="2" />
          </g>
        )}

        {/* W-K: Singa Bermahkota (Raja) — Singa chibi berdiri tegak bersurai coklat-oranye & mahkota emas */}
        {isCat && type === 'k' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Lion Tail with Tuft */}
            <path d="M74 100 C89 96, 92 80, 84 74" fill="none" stroke="#EAB85C" strokeWidth="4.2" />
            <circle cx="84" cy="73" r="5.5" fill="#C46B2B" />
            {/* Royal Cape behind */}
            <path d="M32 76 L26 111 L84 111 L78 76 Z" fill="#C93838" />
            {/* Standing Lion Body */}
            <path d="M36 74 L34 109 Q55 114 76 109 L74 74 Z" fill="#F0BC5E" />
            <ellipse cx="55" cy="94" rx="12" ry="14" fill="#FCE2A6" stroke="none" />
            {/* Paws & Feet */}
            <ellipse cx="43" cy="113" rx="7.5" ry="5" fill="#F0BC5E" />
            <ellipse cx="67" cy="113" rx="7.5" ry="5" fill="#F0BC5E" />
            <circle cx="35" cy="89" r="5.5" fill="#F0BC5E" />
            <circle cx="75" cy="89" r="5.5" fill="#F0BC5E" />
            {/* Fluffy Warm Orange-Brown Lion Mane */}
            <path
              d="M55 24 L64 30 L76 28 L79 39 L86 49 L80 60 L80 71 L68 74 L55 80 L42 74 L30 71 L30 60 L24 49 L31 39 L34 28 L46 30 Z"
              fill="#C86D2D"
            />
            {/* Royal Golden Crown */}
            <path d="M39 30 L38 15 L48 23 L55 12 L62 23 L72 15 L71 30 Z" fill="#F5CB3D" />
            <circle cx="55" cy="23" r="2.6" fill="#E04646" strokeWidth="1.5" />
            {/* Lion Face & Round Ears */}
            <circle cx="37" cy="39" r="6" fill="#F0BC5E" />
            <circle cx="73" cy="39" r="6" fill="#F0BC5E" />
            <ellipse cx="55" cy="54" rx="18" ry="16" fill="#F5C973" />
            <ellipse cx="55" cy="60" rx="9" ry="6.5" fill="#FCE5B3" stroke="none" />
            {/* Warm Noble Eyes */}
            <circle cx="47" cy="52" r="3" fill={ink} />
            <circle cx="48" cy="50.8" r="1.1" fill="#FFFFFF" stroke="none" />
            <circle cx="63" cy="52" r="3" fill={ink} />
            <circle cx="64" cy="50.8" r="1.1" fill="#FFFFFF" stroke="none" />
            {/* Nose & Friendly Smile */}
            <polygon points="51,56 59,56 55,60.5" fill="#8C4124" strokeWidth="1.6" />
            <path d="M49 63 Q55 67 61 63" fill="none" strokeWidth="2.2" />
          </g>
        )}

        {/* ============================================================
            TIM HITAM — GARDA ANJING (DOG GUARD)
           ============================================================ */}

        {/* B-P: Anak Anjing (Pion) — Anak anjing coklat berhelm ksatria besi abu-abu */}
        {!isCat && type === 'p' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Little Guard Boots */}
            <ellipse cx="45" cy="113" rx="6.5" ry="4.5" fill="#4B3E35" />
            <ellipse cx="64" cy="113" rx="6.5" ry="4.5" fill="#4B3E35" />
            {/* Leather Guard Tunic */}
            <path d="M39 76 L36 107 Q55 113 73 107 L70 76 Z" fill="#635147" />
            <rect x="37" y="92" width="35" height="6" rx="2" fill="#3D322C" />
            <circle cx="55" cy="95" r="3.5" fill="#C9A84C" strokeWidth="1.6" />
            {/* Little Arms */}
            <circle cx="35" cy="89" r="5" fill="#9E6E47" />
            <circle cx="74" cy="89" r="5" fill="#9E6E47" />
            {/* Floppy Puppy Ears */}
            <ellipse cx="34" cy="60" rx="6" ry="11" fill="#5A3923" />
            <ellipse cx="76" cy="60" rx="6" ry="11" fill="#5A3923" />
            {/* Puppy Head */}
            <ellipse cx="55" cy="59" rx="19" ry="17" fill="#A6744C" />
            {/* Light Tan Muzzle */}
            <ellipse cx="55" cy="65" rx="10" ry="7" fill="#DFBE99" />
            {/* Grey Iron Pointed Guard Helmet (persis referensi!) */}
            <path d="M34 52 C34 30, 76 30, 76 52 Z" fill="#8C9AA6" />
            <polygon points="55,19 50,33 60,33" fill="#707E8A" />
            <path d="M31 50 Q55 56 79 50 L77 55 Q55 61 33 55 Z" fill="#66737F" />
            {/* Eyes & Snout */}
            <circle cx="46" cy="59" r="3" fill={ink} />
            <circle cx="47" cy="57.8" r="1" fill="#FFFFFF" stroke="none" />
            <circle cx="64" cy="59" r="3" fill={ink} />
            <circle cx="65" cy="57.8" r="1" fill="#FFFFFF" stroke="none" />
            <ellipse cx="55" cy="63" rx="3.8" ry="2.6" fill={ink} />
            <path d="M51 68 Q55 71 59 68" fill="none" strokeWidth="2" />
          </g>
        )}

        {/* B-N: Anjing Boxer (Kuda) — Boxer/Doberman atletis hitam-coklat berdiri gagah */}
        {!isCat && type === 'n' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Four Athletic Legs (Standing Boxer / Doberman Guard Stance) */}
            <path d="M34 90 L31 114 L39 114 L42 94 Z" fill="#2E2D33" />
            <path d="M44 95 L43 115 L51 115 L52 95 Z" fill="#B57A48" />
            <path d="M62 94 L62 114 L70 114 L70 94 Z" fill="#2E2D33" />
            <path d="M72 90 L76 113 L84 113 L79 88 Z" fill="#B57A48" />
            {/* Muscular Sleek Body */}
            <path d="M33 74 C33 62, 76 62, 79 76 L79 96 L34 96 Z" fill="#323138" />
            <path d="M44 74 Q56 88 68 74 L65 94 L47 94 Z" fill="#B57A48" strokeWidth="1.8" />
            {/* Red-Brown Spiked Collar */}
            <path d="M38 66 Q55 73 72 66 L73 73 Q55 80 37 73 Z" fill="#5A355E" />
            <circle cx="46" cy="72" r="2.2" fill="#DDE4EB" strokeWidth="1.3" />
            <circle cx="55" cy="74" r="2.2" fill="#DDE4EB" strokeWidth="1.3" />
            <circle cx="64" cy="72" r="2.2" fill="#DDE4EB" strokeWidth="1.3" />
            {/* Tall Pointed Ears */}
            <polygon points="39,43 32,19 49,34" fill="#26252B" />
            <polygon points="71,43 78,19 61,34" fill="#26252B" />
            {/* Boxer/Doberman Head */}
            <path d="M36 48 C36 33, 74 33, 74 48 C74 62, 65 68, 55 68 C45 68, 36 62, 36 48 Z" fill="#323138" />
            {/* Tan Eyebrow Dots & Muzzle */}
            <circle cx="47" cy="44" r="2.2" fill="#C98A54" stroke="none" />
            <circle cx="63" cy="44" r="2.2" fill="#C98A54" stroke="none" />
            <ellipse cx="55" cy="58" rx="11" ry="8" fill="#C98A54" />
            <ellipse cx="55" cy="55" rx="4.2" ry="2.8" fill={ink} />
            {/* Intense Eyes & Tough Grin */}
            <circle cx="46" cy="49" r="3" fill="#F5D042" strokeWidth="1.8" />
            <circle cx="46" cy="49" r="1.4" fill={ink} stroke="none" />
            <circle cx="64" cy="49" r="3" fill="#F5D042" strokeWidth="1.8" />
            <circle cx="64" cy="49" r="1.4" fill={ink} stroke="none" />
            <path d="M48 61.5 L62 61.5" strokeWidth="2.2" />
            <polygon points="50,61.5 52,58 54,61.5" fill="#FFFFFF" strokeWidth="1.3" />
            <polygon points="56,61.5 58,58 60,61.5" fill="#FFFFFF" strokeWidth="1.3" />
          </g>
        )}

        {/* B-R: Bulldog Kekar (Benteng) — Bulldog coklat berotot + kalung merah + perisai baja berbingkai merah */}
        {!isCat && type === 'r' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Heavy Boots/Feet */}
            <ellipse cx="42" cy="113" rx="8" ry="5" fill="#6E4A30" />
            <ellipse cx="64" cy="113" rx="8" ry="5" fill="#6E4A30" />
            {/* Broad Muscular Bulldog Body */}
            <path d="M29 68 L28 109 L76 109 L75 68 Z" fill="#9C6B46" />
            <ellipse cx="52" cy="90" rx="15" ry="15" fill="#D9BC9B" stroke="none" />
            {/* Spiked Red Collar */}
            <rect x="31" y="67" width="42" height="8" rx="3" fill="#B83B35" />
            <circle cx="39" cy="71" r="2.2" fill="#E8EEF2" strokeWidth="1.3" />
            <circle cx="52" cy="71" r="2.2" fill="#E8EEF2" strokeWidth="1.3" />
            <circle cx="65" cy="71" r="2.2" fill="#E8EEF2" strokeWidth="1.3" />
            {/* Short Folded Ears */}
            <polygon points="31,43 22,36 25,52" fill="#69452C" />
            <polygon points="73,43 82,36 79,52" fill="#69452C" />
            {/* Wide Bulldog Head */}
            <rect x="29" y="34" width="46" height="35" rx="13" fill="#9C6B46" />
            {/* Cream Jowls & Underbite Fangs */}
            <path d="M34 55 Q52 50 70 55 Q72 67 52 67 Q32 67 34 55 Z" fill="#E6CFB3" />
            <ellipse cx="52" cy="54" rx="5" ry="3.2" fill={ink} />
            <path d="M41 62 L63 62" strokeWidth="2.4" />
            <polygon points="43,62 45.5,56.5 48,62" fill="#FFFFFF" strokeWidth="1.5" />
            <polygon points="56,62 58.5,56.5 61,62" fill="#FFFFFF" strokeWidth="1.5" />
            {/* Stern Brows & Eyes */}
            <line x1="37" y1="44" x2="46" y2="47" strokeWidth="2.6" />
            <line x1="67" y1="44" x2="58" y2="47" strokeWidth="2.6" />
            <circle cx="42" cy="49" r="3" fill={ink} />
            <circle cx="62" cy="49" r="3" fill={ink} />
            {/* Heavy Red-Rimmed Iron Shield */}
            <path d="M58 75 L91 72 L89 102 L74 114 L60 102 Z" fill="#B84438" />
            <path d="M63 80 L86 78 L84 99 L74 108 L65 99 Z" fill="#7D8A96" strokeWidth="2" />
            <circle cx="74" cy="93" r="4.5" fill="#E5B742" strokeWidth="1.6" />
          </g>
        )}

        {/* B-B: Anjing Mistik (Gajah) — Berjubah biru tua & tudung mistik + tongkat kristal cyan */}
        {!isCat && type === 'b' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Cyan Rune Staff */}
            <line x1="84" y1="50" x2="80" y2="113" stroke="#3E3247" strokeWidth="4" />
            <polygon points="84,36 91,47 84,58 77,47" fill="#38E8FF" />
            <circle cx="83" cy="45" r="2" fill="#FFFFFF" stroke="none" />
            {/* Feet */}
            <ellipse cx="45" cy="113" rx="6.5" ry="4" fill="#1F2937" />
            <ellipse cx="64" cy="113" rx="6.5" ry="4" fill="#1F2937" />
            {/* Dark Mystic Cloak */}
            <path d="M36 74 L29 110 Q55 116 79 110 L71 74 Z" fill="#2C4259" />
            <path d="M47 75 L55 112 L63 75 Z" fill="#38B6FF" strokeWidth="1.8" />
            {/* Pointed Mystic Hood */}
            <path d="M29 66 C29 38, 42 18, 55 14 C68 18, 81 38, 81 66 L72 74 L38 74 Z" fill="#344E6B" />
            <ellipse cx="55" cy="56" rx="16" ry="14" fill="#1D2836" />
            {/* Hound Snout & Glowing Eyes */}
            <ellipse cx="55" cy="63" rx="9" ry="6" fill="#C49A72" />
            <ellipse cx="55" cy="60.5" rx="3.5" ry="2.4" fill={ink} />
            <ellipse cx="47" cy="53" rx="3.4" ry="2.5" fill="#4CE8FF" strokeWidth="1.4" />
            <ellipse cx="63" cy="53" rx="3.4" ry="2.5" fill="#4CE8FF" strokeWidth="1.4" />
          </g>
        )}

        {/* B-Q: Jenderal Doberman (Menteri) — Doberman komandan jubah merah-gelap + perisai & mahkota */}
        {!isCat && type === 'q' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Commander Red Cape */}
            <path d="M30 74 L24 112 L84 112 L78 74 Z" fill="#9E2B2B" />
            {/* Armored Torso */}
            <path d="M37 72 L34 110 L74 110 L71 72 Z" fill="#2F333D" />
            <path d="M47 80 L54 87 L61 80 M47 88 L54 95 L61 88" fill="none" stroke="#F2C94C" strokeWidth="2.8" />
            {/* Tall Doberman Ears */}
            <polygon points="39,42 31,15 49,33" fill="#23252C" />
            <polygon points="71,42 79,15 61,33" fill="#23252C" />
            {/* Commander Crown */}
            <path d="M42 34 L44 21 L51 28 L55 17 L59 28 L66 21 L68 34 Z" fill="#F2C94C" />
            {/* Sleek Head */}
            <ellipse cx="55" cy="52" rx="18" ry="17" fill="#2F333D" />
            <ellipse cx="55" cy="60" rx="10" ry="7" fill="#CF8F5B" />
            <ellipse cx="55" cy="57.5" rx="3.8" ry="2.6" fill={ink} />
            <circle cx="47" cy="51" r="2.8" fill="#4CE8FF" strokeWidth="1.5" />
            <circle cx="63" cy="51" r="2.8" fill="#4CE8FF" strokeWidth="1.5" />
            {/* General's Shield on Right */}
            <path d="M62 78 L90 75 L88 103 L76 113 L64 103 Z" fill="#B83B35" />
            <path d="M67 82 L85 80 L84 99 L76 107 L68 99 Z" fill="#5D6B78" strokeWidth="1.8" />
          </g>
        )}

        {/* B-K: Raja Mastiff (Raja) — Mastiff besar kekar bermahkota emas & jubah merah bangsawan */}
        {!isCat && type === 'k' && (
          <g stroke={ink} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {/* Heavy Monarch Cape */}
            <path d="M27 72 L21 112 L89 112 L83 72 Z" fill="#8C2626" />
            {/* Armored Mastiff Body */}
            <path d="M34 72 L32 110 Q55 115 78 110 L76 72 Z" fill="#3B3A42" />
            <path d="M45 73 L55 109 L65 73 Z" fill="#D9A73E" strokeWidth="1.8" />
            {/* Gold Pauldrons */}
            <circle cx="33" cy="77" r="7.5" fill="#E5B742" />
            <circle cx="77" cy="77" r="7.5" fill="#E5B742" />
            {/* Feet */}
            <ellipse cx="44" cy="113" rx="7.5" ry="4.5" fill="#26252B" />
            <ellipse cx="66" cy="113" rx="7.5" ry="4.5" fill="#26252B" />
            {/* Heavy Floppy Mastiff Ears */}
            <path d="M34 45 C22 48, 22 68, 33 66 Z" fill="#242329" />
            <path d="M76 45 C88 48, 88 68, 77 66 Z" fill="#242329" />
            {/* Monarch Crown */}
            <path d="M37 35 L39 18 L48 26 L55 14 L62 26 L71 18 L73 35 Z" fill="#F5CB3D" />
            <circle cx="55" cy="26" r="2.8" fill="#38E8FF" strokeWidth="1.4" />
            {/* Broad Noble Mastiff Head */}
            <rect x="33" y="34" width="44" height="36" rx="13" fill="#4D4B54" />
            <ellipse cx="55" cy="59" rx="13" ry="8.5" fill="#C9A27E" />
            <ellipse cx="55" cy="55.5" rx="4.8" ry="3.2" fill={ink} />
            <path d="M47 63 Q55 66.5 63 63" fill="none" strokeWidth="2.2" />
            <circle cx="45" cy="49" r="3" fill="#F5D042" strokeWidth="1.6" />
            <circle cx="65" cy="49" r="3" fill="#F5D042" strokeWidth="1.6" />
          </g>
        )}

        {/* Optional subtle role pill badge near foot */}
        {showBadge && (
          <g>
            <circle
              cx="84"
              cy="108"
              r="11"
              fill={isCat ? '#FFF4C2' : '#324252'}
              stroke={ink}
              strokeWidth="2.2"
            />
            <text
              x="84"
              y="112.5"
              textAnchor="middle"
              fontFamily="'Archivo Black', Impact, sans-serif"
              fontSize="11.5"
              fontWeight="900"
              fill={isCat ? '#3A2610' : '#FFE680'}
            >
              {ROLE_LABELS[type]}
            </text>
          </g>
        )}
      </svg>
    );
  }
);

AnimalPiece.displayName = 'AnimalPiece';
