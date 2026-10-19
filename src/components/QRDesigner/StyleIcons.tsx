import React from 'react';
import { DotType, CornerSquareType, CornerDotType } from '../../types';

// 6 Pattern Preview Icons matching the screenshot
export const PatternIcon: React.FC<{ type: DotType }> = ({ type }) => {
  switch (type) {
    case 'square':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="currentColor">
          <rect x="4" y="4" width="8" height="8" />
          <rect x="16" y="4" width="8" height="8" />
          <rect x="4" y="16" width="8" height="8" />
          <rect x="16" y="16" width="8" height="8" />
          <rect x="28" y="4" width="8" height="8" />
          <rect x="28" y="16" width="8" height="8" />
          <rect x="4" y="28" width="8" height="8" />
          <rect x="16" y="28" width="8" height="8" />
          <rect x="28" y="28" width="8" height="8" />
        </svg>
      );
    case 'rounded':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="currentColor">
          <rect x="4" y="4" width="8" height="8" rx="2.5" />
          <rect x="16" y="4" width="8" height="8" rx="2.5" />
          <rect x="4" y="16" width="8" height="8" rx="2.5" />
          <rect x="16" y="16" width="8" height="8" rx="2.5" />
          <rect x="28" y="4" width="8" height="8" rx="2.5" />
          <rect x="28" y="16" width="8" height="8" rx="2.5" />
          <rect x="4" y="28" width="8" height="8" rx="2.5" />
          <rect x="16" y="28" width="8" height="8" rx="2.5" />
          <rect x="28" y="28" width="8" height="8" rx="2.5" />
        </svg>
      );
    case 'extra-rounded':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="currentColor">
          <rect x="4" y="4" width="8" height="8" rx="4" />
          <rect x="16" y="4" width="8" height="8" rx="4" />
          <rect x="4" y="16" width="8" height="8" rx="4" />
          <rect x="16" y="16" width="8" height="8" rx="4" />
          <rect x="28" y="4" width="8" height="8" rx="4" />
          <rect x="28" y="16" width="8" height="8" rx="4" />
          <rect x="4" y="28" width="8" height="8" rx="4" />
          <rect x="16" y="28" width="8" height="8" rx="4" />
          <rect x="28" y="28" width="8" height="8" rx="4" />
        </svg>
      );
    case 'classy':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="currentColor">
          <path d="M4 4 h14 v14 h-6 v6 h-8 Z" />
          <path d="M22 4 h14 v8 h-6 v6 h-8 Z" />
          <path d="M22 22 h8 v14 h-14 v-6 h6 Z" />
          <circle cx="10" cy="32" r="3.5" />
        </svg>
      );
    case 'dots':
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="currentColor">
          <circle cx="8" cy="8" r="4" />
          <circle cx="20" cy="8" r="4" />
          <circle cx="32" cy="8" r="4" />
          <circle cx="8" cy="20" r="4" />
          <circle cx="20" cy="20" r="4" />
          <circle cx="32" cy="20" r="4" />
          <circle cx="8" cy="32" r="4" />
          <circle cx="20" cy="32" r="4" />
          <circle cx="32" cy="32" r="4" />
        </svg>
      );
    case 'classy-rounded':
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-9 h-9" fill="currentColor">
          <rect x="5" y="5" width="8" height="8" rx="4" />
          <path d="M18 5 h12 a4 4 0 0 1 4 4 v8 a4 4 0 0 1-4 4 h-12 Z" />
          <circle cx="9" cy="25" r="4" />
          <rect x="18" y="25" width="14" height="10" rx="5" />
        </svg>
      );
  }
};

// 7 Corner Square (Outer Frame) Preview Icons
export const CornerSquareIcon: React.FC<{ type: CornerSquareType }> = ({ type }) => {
  switch (type) {
    case 'square':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="4">
          <rect x="5" y="5" width="30" height="30" />
        </svg>
      );
    case 'dot':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="4">
          <circle cx="20" cy="20" r="15" />
        </svg>
      );
    case 'rounded':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="4">
          <rect x="5" y="5" width="30" height="30" rx="7" />
        </svg>
      );
    case 'extra-rounded':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="4">
          <rect x="5" y="5" width="30" height="30" rx="14" />
        </svg>
      );
    case 'heavy':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="5.5">
          <rect x="6" y="6" width="28" height="28" />
        </svg>
      );
    case 'leaf':
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="4">
          <path d="M5 14 A9 9 0 0 1 14 5 L35 5 L35 26 A9 9 0 0 1 26 35 L5 35 Z" />
        </svg>
      );
    case 'dotted':
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="4 3">
          <rect x="5" y="5" width="30" height="30" rx="3" />
        </svg>
      );
  }
};

// 7 Corner Dot (Inner Eye) Preview Icons
export const CornerDotIcon: React.FC<{ type: CornerDotType }> = ({ type }) => {
  switch (type) {
    case 'square':
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="currentColor">
          <rect x="10" y="10" width="20" height="20" />
        </svg>
      );
    case 'dot':
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="currentColor">
          <circle cx="20" cy="20" r="10" />
        </svg>
      );
    case 'rounded':
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="currentColor">
          <rect x="10" y="10" width="20" height="20" rx="5" />
        </svg>
      );
    case 'diamond':
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="currentColor">
          <rect x="12" y="12" width="16" height="16" />
        </svg>
      );
    case 'teardrop':
    case 'leaf':
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="currentColor">
          <path d="M10 10 L28 10 A8 8 0 0 1 28 26 L18 26 A8 8 0 0 1 10 18 Z" />
        </svg>
      );
    case 'grid':
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="currentColor">
          <rect x="9" y="9" width="6" height="6" />
          <rect x="17" y="9" width="6" height="6" />
          <rect x="25" y="9" width="6" height="6" />
          <rect x="9" y="17" width="6" height="6" />
          <rect x="17" y="17" width="6" height="6" />
          <rect x="25" y="17" width="6" height="6" />
          <rect x="9" y="25" width="6" height="6" />
          <rect x="17" y="25" width="6" height="6" />
          <rect x="25" y="25" width="6" height="6" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 40 40" className="w-6 h-6" fill="currentColor">
          <circle cx="20" cy="20" r="7" />
        </svg>
      );
  }
};
