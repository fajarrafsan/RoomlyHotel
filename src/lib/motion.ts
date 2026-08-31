/** Shared motion tokens — transform/opacity only, no springs on large UI. */
export const easeSmooth = [0.16, 1, 0.3, 1] as const;

export const fadeTween = {
  duration: 0.22,
  ease: easeSmooth,
};

export const modalTween = {
  duration: 0.34,
  ease: easeSmooth,
};

export const pillTween = {
  type: 'tween' as const,
  duration: 0.3,
  ease: easeSmooth,
};
