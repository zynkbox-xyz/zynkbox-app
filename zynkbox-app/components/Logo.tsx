import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

export default function Logo({ className = '', size = 36 }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Minimal Geometric Z-Envelope Mark */}
      <div 
        className="relative flex items-center justify-center rounded-xl bg-gradient-to-b from-[#18181b] to-[#09090b] shadow-sm border border-zinc-800/80"
        style={{ width: size, height: size }}
      >
        <svg
          width={Math.round(size * 0.65)}
          height={Math.round(size * 0.65)}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="zynkZGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stopColor="#38BDF8" /> {/* Cyan 400 */}
              <stop offset="0.5" stopColor="#6366F1" /> {/* Indigo 500 */}
              <stop offset="1" stopColor="#10B981" /> {/* Emerald 500 */}
            </linearGradient>
          </defs>

          {/* Minimal folded geometric path combining 'Z' + Mail Flap */}
          <path
            d="M4 6.5C4 5.67157 4.67157 5 5.5 5H18.5C19.3284 5 20 5.67157 20 6.5L12 12.5L4 6.5Z"
            stroke="url(#zynkZGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 7.5L7 17.5H19C19.5523 17.5 20 17.0523 20 16.5V7.5Z"
            stroke="url(#zynkZGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Subtle glowing accent dot */}
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white dark:border-zinc-950" />
      </div>

      {/* Modern Minimalist Wordmark */}
      <div className="flex items-baseline gap-1.5 select-none tracking-tight">
        <span className="text-[19px] font-black tracking-tight text-zinc-900 font-sans">
          zynk<span className="bg-gradient-to-r from-cyan-600 via-indigo-600 to-emerald-600 bg-clip-text text-transparent">box</span>
        </span>
        <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
          .xyz
        </span>
      </div>
    </div>
  );
}