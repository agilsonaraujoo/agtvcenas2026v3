import React from 'react';

// Zap, o mascote da AGTV: a TV da logo com rosto em pixel. Mesmo desenho da ficha do personagem
// (video-ads/catalogo/mascote.html). A animação (aceno, antenas e piscada) é só CSS e respeita
// "reduzir movimento".
const GREEN = '#b7ff4a';
const PURPLE = '#9a7bff';

const pix = (rows, cx, cy, size, prefix) => {
  const x0 = cx - (rows[0].length * size) / 2;
  const y0 = cy - (rows.length * size) / 2;
  return rows.flatMap((row, r) => [...row].map((cell, k) => (cell === '#'
    ? <rect key={`${prefix}${r}-${k}`} x={x0 + k * size} y={y0 + r * size} width={size + 0.3} height={size + 0.3} fill={GREEN} />
    : null)));
};

const EYE = ['.##.', '####', '####', '####', '.##.'];
const MOUTH = ['#######', '#.....#', '.#...#.', '..###..'];

const ZapMascot = ({ className = '', waving = true, title }) => (
  <svg viewBox="-125 -110 250 240" className={`zap-mascot ${waving ? 'is-waving' : ''} ${className}`} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
    <defs>
      <radialGradient id="zap-tela" cx=".35" cy=".25" r=".9">
        <stop offset="0" stopColor="#1c2030" />
        <stop offset="1" stopColor="#090a10" />
      </radialGradient>
    </defs>
    <path d="M-24 46 L-28 112 M24 46 L28 112" stroke={PURPLE} strokeWidth="9" strokeLinecap="round" />
    <rect x="-48" y="106" width="34" height="16" rx="8" fill={GREEN} />
    <rect x="14" y="106" width="34" height="16" rx="8" fill={GREEN} />
    <g className="zap-antenna zap-antenna--left">
      <path d="M0 -46 L-26 -78" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" />
      <circle cx="-26" cy="-78" r="9" fill={PURPLE} />
    </g>
    <g className="zap-antenna zap-antenna--right">
      <path d="M0 -46 L26 -78" stroke={PURPLE} strokeWidth="7" strokeLinecap="round" />
      <circle cx="26" cy="-78" r="9" fill={PURPLE} />
    </g>
    <path d="M-60 20 Q-78 46 -74 72" stroke={PURPLE} strokeWidth="8" strokeLinecap="round" fill="none" />
    <circle cx="-74" cy="72" r="9.5" fill={GREEN} />
    <rect x="-62" y="-46" width="124" height="96" rx="26" fill="#0d0f15" stroke={GREEN} strokeWidth="12" />
    <rect x="-50" y="-34" width="100" height="72" rx="16" fill="url(#zap-tela)" />
    <path d="M-40 -28 Q-20 -32 6 -30" stroke="#fff" strokeOpacity=".12" strokeWidth="5" strokeLinecap="round" fill="none" />
    <g className="zap-eyes">
      {pix(EYE, -20, -6, 5, 'l')}
      {pix(EYE, 20, -6, 5, 'r')}
    </g>
    {pix(MOUTH, 0, 20, 4, 'm')}
    <rect x="-42" y="8" width="10" height="5" fill="#ff7ab6" opacity=".7" />
    <rect x="32" y="8" width="10" height="5" fill="#ff7ab6" opacity=".7" />
    <g className="zap-arm">
      <path d="M60 6 Q92 -14 104 -52" stroke={PURPLE} strokeWidth="8" strokeLinecap="round" fill="none" />
      <circle cx="104" cy="-52" r="9.5" fill={GREEN} />
    </g>
  </svg>
);

export default ZapMascot;
