import React from 'react';

// Ilustrasi Vas Bunga Aesthetic (Persis seperti bagian bawah sidebar di desain acuan)
export const FlowerVaseIllustration: React.FC<{ className?: string }> = ({ className = "w-48 h-auto" }) => (
  <svg
    viewBox="0 0 200 280"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background Glow */}
    <ellipse cx="100" cy="270" rx="75" ry="10" fill="#3D3B9E" opacity="0.3" />
    
    {/* Stems */}
    <path
      d="M100 180 Q85 130 65 80"
      stroke="#B7A7F6"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M100 180 Q105 110 115 50"
      stroke="#D1C4FC"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M100 180 Q130 140 155 100"
      stroke="#B7A7F6"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M85 130 Q50 120 40 100"
      stroke="#B7A7F6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M110 125 Q145 120 160 115"
      stroke="#B7A7F6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />

    {/* Leaves & Petals - Left Stem */}
    <ellipse cx="60" cy="75" rx="14" ry="24" transform="rotate(-30 60 75)" fill="#F472B6" opacity="0.9" />
    <ellipse cx="45" cy="100" rx="12" ry="20" transform="rotate(-45 45 100)" fill="#C084FC" opacity="0.9" />
    <ellipse cx="52" cy="135" rx="10" ry="18" transform="rotate(-35 52 135)" fill="#A78BFA" opacity="0.85" />
    <ellipse cx="75" cy="110" rx="11" ry="20" transform="rotate(-15 75 110)" fill="#F472B6" opacity="0.7" />

    {/* Center Top Bloom */}
    <ellipse cx="115" cy="45" rx="16" ry="28" transform="rotate(10 115 45)" fill="#EC4899" opacity="0.95" />
    <ellipse cx="102" cy="75" rx="13" ry="22" transform="rotate(-10 102 75)" fill="#E879F9" opacity="0.9" />
    <ellipse cx="125" cy="85" rx="12" ry="20" transform="rotate(25 125 85)" fill="#C084FC" opacity="0.85" />

    {/* Right Stem Leaves */}
    <ellipse cx="158" cy="95" rx="14" ry="22" transform="rotate(40 158 95)" fill="#C084FC" opacity="0.9" />
    <ellipse cx="140" cy="125" rx="12" ry="20" transform="rotate(30 140 125)" fill="#A78BFA" opacity="0.85" />
    <ellipse cx="160" cy="120" rx="10" ry="18" transform="rotate(50 160 120)" fill="#F472B6" opacity="0.75" />

    {/* Elegant White & Lavender Vase */}
    <path
      d="M85 165 C85 165 70 210 55 240 C45 260 60 270 100 270 C140 270 155 260 145 240 C130 210 115 165 115 165 Z"
      fill="url(#vaseGradient)"
    />
    {/* Vase Rim */}
    <ellipse cx="100" cy="165" rx="15" ry="5" fill="#E2E8F0" />
    <ellipse cx="100" cy="165" rx="11" ry="3" fill="#6B5CE7" />

    {/* Vase highlight and shadow */}
    <path
      d="M75 220 C68 240 75 258 95 265 C78 260 62 245 68 230 C72 220 75 210 77 200 Z"
      fill="#FFFFFF"
      opacity="0.6"
    />

    <defs>
      <linearGradient id="vaseGradient" x1="60" y1="165" x2="145" y2="270" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFFFF" />
        <stop offset="0.65" stopColor="#EDE9FE" />
        <stop offset="1" stopColor="#DDD6FE" />
      </linearGradient>
    </defs>
  </svg>
);

// Ilustrasi Lampu Meja & Buku (Persis di card riwayat bawah pada desain acuan)
export const DeskLampIllustration: React.FC<{ className?: string }> = ({ className = "w-40 h-auto" }) => (
  <svg
    viewBox="0 0 160 140"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Lamp Cone Glow */}
    <path
      d="M135 45 L95 125 L155 125 Z"
      fill="url(#lightCone)"
      opacity="0.3"
    />
    
    {/* Lamp Structure */}
    <path
      d="M142 125 L142 68 Q142 45 130 40 L125 38"
      stroke="#475569"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M125 38 L112 55"
      stroke="#334155"
      strokeWidth="4"
      strokeLinecap="round"
    />
    {/* Lamp Hood (Purple/Indigo) */}
    <path
      d="M110 32 L132 46 C136 50 128 58 124 57 L102 43 C98 40 106 30 110 32 Z"
      fill="#6366F1"
    />
    <ellipse cx="118" cy="51" rx="12" ry="6" transform="rotate(25 118 51)" fill="#FDE047" opacity="0.9" />

    {/* Books Stack */}
    <rect x="85" y="120" width="60" height="9" rx="3" fill="#E879F9" />
    <rect x="87" y="112" width="56" height="8" rx="2.5" fill="#A855F7" />

    {/* Mini Succulent Plant in Pot */}
    <ellipse cx="118" cy="112" rx="10" ry="3" fill="#CBD5E1" />
    <path d="M112 112 L114 102 L122 102 L124 112 Z" fill="#94A3B8" />
    {/* Plant leaves */}
    <ellipse cx="116" cy="98" rx="3.5" ry="6" transform="rotate(-20 116 98)" fill="#34D399" />
    <ellipse cx="120" cy="98" rx="3.5" ry="6" transform="rotate(20 120 98)" fill="#10B981" />
    <ellipse cx="118" cy="94" rx="3" ry="7" fill="#059669" />

    {/* Lamp Base Stand */}
    <rect x="135" y="125" width="18" height="4" rx="2" fill="#334155" />

    <defs>
      <linearGradient id="lightCone" x1="120" y1="50" x2="120" y2="125" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" stopOpacity="0.8" />
        <stop offset="1" stopColor="#FEF08A" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

