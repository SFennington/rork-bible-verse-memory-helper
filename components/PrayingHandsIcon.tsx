import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PrayingHandsIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function PrayingHandsIcon({ 
  size = 24, 
  color = '#000', 
  strokeWidth = 2 
}: PrayingHandsIconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Left hand */}
      <Path d="M12 6V4a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v8" />
      <Path d="M8 12v8a2 2 0 0 0 2 2h1" />
      <Path d="M8 8a1 1 0 0 0-1 1v3" />
      
      {/* Right hand */}
      <Path d="M12 6V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v8" />
      <Path d="M16 12v8a2 2 0 0 1-2 2h-1" />
      <Path d="M16 8a1 1 0 0 1 1 1v3" />
      
      {/* Center line where hands meet */}
      <Path d="M12 4v8" />
    </Svg>
  );
}

