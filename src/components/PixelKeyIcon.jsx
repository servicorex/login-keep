import React from 'react';

/**
 * PixelKeyIcon renders the signature 8-bit / pixel-art key logo
 * faithfully digitized from LoginKeep's brand mark.
 */
export default function PixelKeyIcon({ className = 'w-5 h-5', fill = 'currentColor' }) {
  return (
    <svg
      viewBox="0 0 4 9"
      fill={fill}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      {/* Row 0: brackets { } */}
      <rect x="0" y="0" width="1" height="1" />
      <rect x="3" y="0" width="1" height="1" />
      {/* Row 1: brackets { } */}
      <rect x="0" y="1" width="1" height="1" />
      <rect x="3" y="1" width="1" height="1" />
      {/* Row 2: collar */}
      <rect x="1" y="2" width="2" height="1" />
      {/* Rows 3-6: vertical stem */}
      <rect x="1" y="3" width="2" height="4" />
      {/* Row 7: lower-left ward step */}
      <rect x="0" y="7" width="1" height="1" />
      {/* Row 8: lower-center tip step */}
      <rect x="1" y="8" width="1" height="1" />
    </svg>
  );
}

