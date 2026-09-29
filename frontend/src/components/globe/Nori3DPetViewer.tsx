import React from 'react';
import { CompanionStyle, useNori } from '../../context/NoriContext';
import { NoriVoiceGlobe3D } from './NoriVoiceGlobe3D';
import { CompanionThreeCanvas } from './CompanionThreeCanvas';

interface Nori3DPetViewerProps {
  companionStyle: CompanionStyle;
  isThinking?: boolean;
  isSpeaking?: boolean;
  size?: number;
  interactive?: boolean;
  className?: string;
}

export const Nori3DPetViewer: React.FC<Nori3DPetViewerProps> = ({
  companionStyle = 'orb',
  isThinking = false,
  isSpeaking = false,
  size = 320,
  interactive = true,
  className = ''
}) => {
  const { noriState, audioResonanceLevel } = useNori();

  // If companionStyle is orb, render the 3D Fibonacci Voice Globe
  if (companionStyle === 'orb') {
    return (
      <NoriVoiceGlobe3D
        state={noriState}
        size={size}
        audioLevel={audioResonanceLevel}
        interactive={interactive}
        className={className}
      />
    );
  }

  // Real, interactive 3D procedural Three.js character models (Nova, Kuro, Lumi, Rover, Sprout)
  return (
    <CompanionThreeCanvas
      style={companionStyle}
      size={size}
      interactive={interactive}
      audioLevel={audioResonanceLevel}
      className={className}
    />
  );
};

