import React from 'react';

export type PositionOrigin = { clientX: number; clientY: number } | React.MouseEvent | MouseEvent | null | undefined;

/**
 * Triggers a circular reveal animation when changing appearance/theme.
 * Uses the Web View Transitions API (`document.startViewTransition`) with circular clip-path expansion.
 * Falls back gracefully to standard state update if unsupported or reduced motion is requested.
 */
export function animateAppearanceChange(
  event: PositionOrigin,
  updateCallback: () => void
): void {
  // Check if browser supports View Transitions API and user hasn't requested reduced motion
  const isSupported =
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!isSupported) {
    updateCallback();
    return;
  }

  // Determine origin coordinates for circular expansion
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (event) {
    if ('clientX' in event && typeof event.clientX === 'number') {
      x = event.clientX;
    }
    if ('clientY' in event && typeof event.clientY === 'number') {
      y = event.clientY;
    }
  }

  // Calculate distance to furthest corner to ensure circle covers entire viewport
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Execute view transition
  // @ts-ignore - document.startViewTransition typing in standard TS lib
  const transition = document.startViewTransition(() => {
    updateCallback();
  });

  transition.ready.then(() => {
    const clipPath = [
      `circle(0px at ${x}px ${y}px)`,
      `circle(${endRadius}px at ${x}px ${y}px)`
    ];

    requestAnimationFrame(() => {
      document.documentElement.animate(
        {
          clipPath: clipPath
        },
        {
          duration: 400,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          pseudoElement: '::view-transition-new(root)'
        }
      );
    });
  });
}

/**
 * Reusable React Hook for triggering appearance/theme change animations from any component.
 */
export function useAppearanceTransition() {
  const triggerTransition = React.useCallback(
    (updateCallback: () => void, event?: PositionOrigin) => {
      animateAppearanceChange(event, updateCallback);
    },
    []
  );

  return { triggerTransition };
}
