export const viewOnce = { once: true, margin: '-80px' };

export const blurUp = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' }
};

export const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 }
};

export const zoomFade = {
  initial: { opacity: 0, scale: 0.94 },
  animate: { opacity: 1, scale: 1 }
};

export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1
    }
  }
};
