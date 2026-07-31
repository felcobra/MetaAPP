"use client";

import { useCallback, useRef, useState, type MouseEvent, type WheelEvent } from "react";

export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 1.6;

const DEFAULT_ZOOM = 1;
const ZOOM_STEP = 0.1;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

/**
 * Drag-to-pan plus wheel-to-zoom for a canvas surface.
 * `onBackgroundPress` fires when the drag starts on empty canvas, which the
 * chart uses to close the members panel.
 */
export function usePanZoom(onBackgroundPress?: () => void) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const lastPointer = useRef({ x: 0, y: 0 });

  const zoomIn = useCallback(() => setZoom((current) => clampZoom(current + ZOOM_STEP)), []);
  const zoomOut = useCallback(() => setZoom((current) => clampZoom(current - ZOOM_STEP)), []);

  const reset = useCallback(() => {
    setZoom(DEFAULT_ZOOM);
    setPan({ x: 0, y: 0 });
  }, []);

  function handleMouseDown(event: MouseEvent<HTMLDivElement>) {
    setIsPanning(true);
    lastPointer.current = { x: event.clientX, y: event.clientY };
    onBackgroundPress?.();
  }

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!isPanning) return;
    const deltaX = event.clientX - lastPointer.current.x;
    const deltaY = event.clientY - lastPointer.current.y;
    lastPointer.current = { x: event.clientX, y: event.clientY };
    setPan((current) => ({ x: current.x + deltaX, y: current.y + deltaY }));
  }

  function stopPanning() {
    setIsPanning(false);
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setZoom((current) => clampZoom(current - event.deltaY * 0.001));
  }

  return {
    zoom,
    pan,
    isPanning,
    zoomIn,
    zoomOut,
    reset,
    surfaceProps: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: stopPanning,
      onMouseLeave: stopPanning,
      onWheel: handleWheel,
    },
  };
}
