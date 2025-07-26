import { vscForeground } from "..";

interface ElvixLogoProps {
  height?: number;
  width?: number;
}

export default function ElvixLogo({
  height = 987,
  width = 299,
}: ElvixLogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 987 299"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* ELVIX AI Logo - Modern AI-themed design */}
      <defs>
        <linearGradient id="elvixGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00d2ff" />
          <stop offset="50%" stopColor="#3a7bd5" />
          <stop offset="100%" stopColor="#8e44ad" />
        </linearGradient>
      </defs>
      
      {/* Main ELVIX text */}
      <g transform="translate(20, 60)">
        {/* E */}
        <path
          d="M0 0 L0 120 L80 120 M0 0 L60 0 M0 60 L50 60"
          stroke="url(#elvixGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* L */}
        <path
          d="M120 0 L120 120 L180 120"
          stroke="url(#elvixGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* V */}
        <path
          d="M220 0 L250 120 L280 0"
          stroke="url(#elvixGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeJoin="round"
          fill="none"
        />
        
        {/* I */}
        <path
          d="M320 0 L320 120 M300 0 L340 0 M300 120 L340 120"
          stroke="url(#elvixGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* X */}
        <path
          d="M380 0 L450 120 M450 0 L380 120"
          stroke="url(#elvixGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      
      {/* AI text */}
      <g transform="translate(500, 60)">
        {/* A */}
        <path
          d="M0 120 L30 0 L60 120 M15 80 L45 80"
          stroke="url(#elvixGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeJoin="round"
          fill="none"
        />
        
        {/* I */}
        <path
          d="M100 0 L100 120 M85 0 L115 0 M85 120 L115 120"
          stroke="url(#elvixGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
      </g>
      
      {/* AI Circuit pattern decoration */}
      <g transform="translate(650, 40)" opacity="0.6">
        <circle cx="0" cy="0" r="4" fill="url(#elvixGradient)" />
        <circle cx="30" cy="20" r="4" fill="url(#elvixGradient)" />
        <circle cx="60" cy="0" r="4" fill="url(#elvixGradient)" />
        <circle cx="90" cy="30" r="4" fill="url(#elvixGradient)" />
        <circle cx="120" cy="10" r="4" fill="url(#elvixGradient)" />
        
        <path d="M0 0 L30 20 M30 20 L60 0 M60 0 L90 30 M90 30 L120 10" 
              stroke="url(#elvixGradient)" 
              strokeWidth="2" 
              fill="none" />
        
        <circle cx="15" cy="60" r="3" fill="url(#elvixGradient)" />
        <circle cx="45" cy="80" r="3" fill="url(#elvixGradient)" />
        <circle cx="75" cy="60" r="3" fill="url(#elvixGradient)" />
        <circle cx="105" cy="90" r="3" fill="url(#elvixGradient)" />
        
        <path d="M15 60 L45 80 M45 80 L75 60 M75 60 L105 90" 
              stroke="url(#elvixGradient)" 
              strokeWidth="2" 
              fill="none" />
      </g>
      
      {/* Neural network node decoration */}
      <g transform="translate(800, 50)" opacity="0.4">
        <circle cx="20" cy="20" r="6" fill="url(#elvixGradient)" />
        <circle cx="60" cy="10" r="6" fill="url(#elvixGradient)" />
        <circle cx="100" cy="30" r="6" fill="url(#elvixGradient)" />
        <circle cx="140" cy="20" r="6" fill="url(#elvixGradient)" />
        
        <path d="M20 20 L60 10 M60 10 L100 30 M100 30 L140 20 M20 20 L100 30 M60 10 L140 20" 
              stroke="url(#elvixGradient)" 
              strokeWidth="1.5" 
              opacity="0.6" 
              fill="none" />
      </g>
      
      {/* Futuristic accent lines */}
      <path d="M50 200 L200 200 M250 200 L400 200 M450 200 L600 200" 
            stroke="url(#elvixGradient)" 
            strokeWidth="3" 
            opacity="0.7" 
            fill="none" />
      
      <path d="M100 220 L300 220 M350 220 L550 220" 
            stroke="url(#elvixGradient)" 
            strokeWidth="2" 
            opacity="0.5" 
            fill="none" />
    </svg>
  );
}