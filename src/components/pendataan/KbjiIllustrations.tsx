import React from 'react';

// Hero Banner Vector Illustration (Student / Surveyor with tablet on books)
export const HeroBannerIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-36' }) => (
  <svg
    viewBox="0 0 280 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background soft pastel clouds/shapes */}
    <circle cx="210" cy="90" r="65" fill="#C5C2FC" fillOpacity="0.6" />
    <circle cx="160" cy="140" r="30" fill="#FF82BE" fillOpacity="0.4" />
    <path
      d="M140 160 C130 130, 150 110, 145 80"
      stroke="#1E1B4B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeDasharray="4 4"
    />
    <path
      d="M240 60 L248 52 M248 60 L240 52"
      stroke="#1E1B4B"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <circle cx="190" cy="40" r="4" fill="#FF82BE" />
    <circle cx="150" cy="70" r="5" fill="#FFAF65" />
    <rect x="220" y="30" width="12" height="12" rx="3" fill="#FF82BE" transform="rotate(15 220 30)" />

    {/* Stacked Books at the bottom */}
    {/* Book 1 (Bottom) */}
    <path
      d="M120 185 L260 185 C264 185 268 181 268 177 L268 168 C268 164 264 160 260 160 L120 160 C116 160 112 164 112 168 L112 177 C112 181 116 185 120 185 Z"
      fill="#FFFFFF"
      stroke="#1E1B4B"
      strokeWidth="3.5"
    />
    <line x1="125" y1="172" x2="255" y2="172" stroke="#E2E8F0" strokeWidth="2" />
    {/* Book 2 (Middle - Pink) */}
    <path
      d="M140 160 L255 160 C258 160 261 157 261 154 L261 146 C261 143 258 140 255 140 L140 140 C137 140 134 143 134 146 L134 154 C134 157 137 160 140 160 Z"
      fill="#FF82BE"
      stroke="#1E1B4B"
      strokeWidth="3.5"
    />
    {/* Book 3 (Top - White) */}
    <path
      d="M130 140 L245 140 C248 140 251 137 251 134 L251 126 C251 123 248 120 245 120 L130 120 C127 120 124 123 124 126 L124 134 C124 137 127 140 130 140 Z"
      fill="#FFFFFF"
      stroke="#1E1B4B"
      strokeWidth="3.5"
    />

    {/* Character Sitting on Books */}
    {/* Legs in white pants */}
    <path
      d="M185 120 C185 100, 165 95, 155 105 C145 115, 155 135, 175 135 L190 135"
      fill="#FFFFFF"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    <path
      d="M190 120 C200 125, 205 145, 195 165 L180 165"
      fill="#FFFFFF"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Body in dark jacket */}
    <path
      d="M180 60 C175 75, 170 100, 185 115 C195 115, 215 110, 220 95 C225 80, 215 65, 200 60 Z"
      fill="#1E1B4B"
      stroke="#1E1B4B"
      strokeWidth="3"
    />
    {/* Head & Hair */}
    <circle cx="205" cy="45" r="14" fill="#FFE4D6" stroke="#1E1B4B" strokeWidth="3" />
    <path
      d="M196 42 C196 32, 210 28, 220 34 C225 38, 226 48, 220 54 C215 54, 210 50, 202 52 Z"
      fill="#1E1B4B"
    />
    {/* Hair Bun / ponytail */}
    <circle cx="225" cy="32" r="10" fill="#1E1B4B" />
    <path d="M228 22 C236 20, 242 28, 238 34" stroke="#1E1B4B" strokeWidth="3" fill="#1E1B4B" />

    {/* Arms holding tablet */}
    <path
      d="M190 75 L180 92 L205 92"
      fill="none"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Tablet device */}
    <rect
      x="178"
      y="80"
      width="24"
      height="18"
      rx="3"
      fill="#FFFFFF"
      stroke="#1E1B4B"
      strokeWidth="2.5"
      transform="rotate(-5 178 80)"
    />
    <line x1="183" y1="88" x2="197" y2="87" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />

    {/* Decorative plant / leaves on the left */}
    <path
      d="M115 170 C105 150, 115 130, 130 125 C130 140, 125 155, 115 170 Z"
      fill="#FF82BE"
      stroke="#1E1B4B"
      strokeWidth="2.5"
    />
    <path
      d="M130 180 C135 160, 145 150, 155 155 C150 170, 140 175, 130 180 Z"
      fill="#C5C2FC"
      stroke="#1E1B4B"
      strokeWidth="2.5"
    />
  </svg>
);

// Card Illustration 1: Person with big Question & Exclamation Speech Bubble (matching reference card 1)
export const SpeechQuestionIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-36' }) => (
  <svg
    viewBox="0 0 240 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Soft Pastel Background Circles */}
    <circle cx="120" cy="75" r="55" fill="#EBE9FD" />
    <circle cx="50" cy="100" r="35" fill="#FF82BE" fillOpacity="0.4" />
    <circle cx="190" cy="50" r="25" fill="#C5C2FC" fillOpacity="0.5" />

    {/* Big Speech Bubble with Question Mark */}
    <path
      d="M70 25 C110 25, 140 45, 140 75 C140 95, 125 110, 100 115 L85 130 L90 115 C75 113, 60 100, 60 75 C60 45, 70 25, 70 25 Z"
      fill="#FFFFFF"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinejoin="round"
    />
    {/* Pink Question Mark inside Bubble */}
    <path
      d="M90 52 C90 42, 105 42, 105 52 C105 60, 97 62, 97 70"
      stroke="#FF82BE"
      strokeWidth="5"
      strokeLinecap="round"
    />
    <circle cx="97" cy="80" r="3" fill="#FF82BE" />

    {/* Smaller Bubble with Exclamation Mark on Right */}
    <ellipse cx="155" cy="45" rx="18" ry="16" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="3" />
    <line x1="155" y1="38" x2="155" y2="46" stroke="#FF82BE" strokeWidth="4" strokeLinecap="round" />
    <circle cx="155" cy="52" r="2" fill="#FF82BE" />

    {/* Character peering from the bottom right */}
    <path
      d="M165 140 C160 110, 175 90, 195 85 C215 90, 225 110, 220 140 Z"
      fill="#1E1B4B"
      stroke="#1E1B4B"
      strokeWidth="3"
    />
    {/* Head */}
    <circle cx="185" cy="80" r="13" fill="#FFE4D6" stroke="#1E1B4B" strokeWidth="3" />
    <path d="M178 75 C180 68, 192 68, 196 75 Z" fill="#1E1B4B" />
    {/* Hand reaching out */}
    <path
      d="M170 120 C155 115, 135 125, 125 128"
      stroke="#1E1B4B"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <circle cx="123" cy="128" r="4" fill="#FFE4D6" stroke="#1E1B4B" strokeWidth="2.5" />
  </svg>
);

// Card Illustration 2: Person holding open pink book with gears & lightbulb (matching reference card 2)
export const BookGearIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-36' }) => (
  <svg
    viewBox="0 0 240 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Soft Pastel Background Circles */}
    <circle cx="120" cy="75" r="55" fill="#E3E7FD" />
    <circle cx="170" cy="85" r="45" fill="#C5C2FC" fillOpacity="0.4" />
    <circle cx="195" cy="100" r="20" fill="#FF82BE" fillOpacity="0.3" />

    {/* Info circle 'i' in background */}
    <circle cx="165" cy="55" r="18" fill="#FFFFFF" stroke="#C5C2FC" strokeWidth="2.5" />
    <circle cx="165" cy="48" r="2.5" fill="#1E1B4B" />
    <line x1="165" y1="54" x2="165" y2="63" stroke="#1E1B4B" strokeWidth="3" strokeLinecap="round" />

    {/* Decorative Gear Cog */}
    <g transform="translate(180, 100)">
      <circle cx="14" cy="14" r="7" fill="#E3E7FD" stroke="#1E1B4B" strokeWidth="3" />
      <path
        d="M14 2 L14 6 M14 22 L14 26 M2 14 L6 14 M22 14 L26 14 M5 5 L8 8 M20 20 L23 23 M5 23 L8 20 M20 8 L23 5"
        stroke="#1E1B4B"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </g>

    {/* Character in dark jacket holding pink book */}
    <path
      d="M110 145 C105 105, 125 90, 145 85 C165 90, 180 105, 175 145 Z"
      fill="#1E1B4B"
      stroke="#1E1B4B"
      strokeWidth="3"
    />
    {/* Head */}
    <circle cx="138" cy="70" r="13" fill="#FFE4D6" stroke="#1E1B4B" strokeWidth="3" />
    <path d="M130 65 C132 58, 144 58, 148 65 Z" fill="#1E1B4B" />

    {/* Open Pink Book held up */}
    <path
      d="M148 75 L170 72 C173 72, 175 75, 175 78 L170 108 C170 111, 167 113, 164 113 L145 110 L148 75 Z"
      fill="#FF82BE"
      stroke="#1E1B4B"
      strokeWidth="3"
    />
    <path
      d="M148 75 L128 72 C125 72, 123 75, 123 78 L128 108 C128 111, 131 113, 134 113 L148 110 L148 75 Z"
      fill="#FFFFFF"
      stroke="#1E1B4B"
      strokeWidth="3"
    />
    <line x1="133" y1="82" x2="143" y2="84" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
    <line x1="133" y1="90" x2="143" y2="92" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />

    {/* Tiny sparkles/plus */}
    <path d="M75 50 L85 50 M80 45 L80 55" stroke="#FFAF65" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="95" cy="70" r="3" fill="#FF82BE" />
  </svg>
);

// Card Illustration 3: Field Surveyor / Agriculture & Maritime (Sprout / Sea / Tool)
export const FieldSurveyorIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-36' }) => (
  <svg
    viewBox="0 0 240 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Soft Pastel Background Circles */}
    <circle cx="120" cy="75" r="55" fill="#E8FDF0" />
    <circle cx="70" cy="95" r="40" fill="#FFAF65" fillOpacity="0.35" />
    <circle cx="180" cy="65" r="30" fill="#C5C2FC" fillOpacity="0.4" />

    {/* Sprout & Plants */}
    <path
      d="M60 115 C55 90, 75 75, 95 85 C85 100, 75 110, 60 115 Z"
      fill="#99E6B4"
      stroke="#1E1B4B"
      strokeWidth="3"
    />
    <path
      d="M90 120 C95 100, 110 90, 120 95 C115 110, 105 115, 90 120 Z"
      fill="#4ADE80"
      stroke="#1E1B4B"
      strokeWidth="3"
    />

    {/* Character with clipboard & cap */}
    <path
      d="M135 145 C130 110, 145 95, 165 90 C185 95, 195 110, 190 145 Z"
      fill="#1E1B4B"
      stroke="#1E1B4B"
      strokeWidth="3"
    />
    {/* Head & Cap */}
    <circle cx="158" cy="78" r="13" fill="#FFE4D6" stroke="#1E1B4B" strokeWidth="3" />
    {/* Cap visor */}
    <path d="M148 72 C150 64, 166 64, 172 70 L180 72 Z" fill="#FFAF65" stroke="#1E1B4B" strokeWidth="2.5" />

    {/* Clipboard held */}
    <rect x="130" y="95" width="22" height="28" rx="3" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="2.5" />
    <rect x="136" y="92" width="10" height="4" rx="1.5" fill="#1E1B4B" />
    <line x1="135" y1="104" x2="147" y2="104" stroke="#99E6B4" strokeWidth="2" strokeLinecap="round" />
    <line x1="135" y1="110" x2="147" y2="110" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// Card Illustration 4: Services / Trade / Store / Cafe
export const ServiceTradeIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-36' }) => (
  <svg
    viewBox="0 0 240 150"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Soft Pastel Background Circles */}
    <circle cx="120" cy="75" r="55" fill="#FFF3E8" />
    <circle cx="65" cy="80" r="38" fill="#FFAF65" fillOpacity="0.4" />
    <circle cx="175" cy="65" r="30" fill="#FF82BE" fillOpacity="0.3" />

    {/* Coffee Cup / Cloche badge */}
    <ellipse cx="85" cy="115" rx="22" ry="7" fill="#FFFFFF" stroke="#1E1B4B" strokeWidth="2.5" />
    <path
      d="M70 95 C70 110, 100 110, 100 95 Z"
      fill="#FFAF65"
      stroke="#1E1B4B"
      strokeWidth="2.5"
    />
    {/* Steam curls */}
    <path d="M80 88 C78 82, 84 80, 82 74" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />
    <path d="M88 88 C86 82, 92 80, 90 74" stroke="#1E1B4B" strokeWidth="2" strokeLinecap="round" />

    {/* Cash register / Bag */}
    <path
      d="M145 145 C140 110, 155 95, 175 90 C195 95, 205 110, 200 145 Z"
      fill="#1E1B4B"
      stroke="#1E1B4B"
      strokeWidth="3"
    />
    <circle cx="168" cy="78" r="13" fill="#FFE4D6" stroke="#1E1B4B" strokeWidth="3" />
    <path d="M160 72 C162 65, 174 65, 178 72 Z" fill="#1E1B4B" />

    {/* Shopping Bag */}
    <rect x="135" y="105" width="20" height="22" rx="3" fill="#FF82BE" stroke="#1E1B4B" strokeWidth="2.5" />
    <path d="M141 105 C141 98, 149 98, 149 105" fill="none" stroke="#1E1B4B" strokeWidth="2" />
  </svg>
);

