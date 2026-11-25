import { useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';

interface SearchDropdownOptions {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  panelRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  maxHeight?: number;
  minWidth?: number;
}

const hiddenPosition: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 80,
  visibility: 'hidden',
  boxSizing: 'border-box',
};

/** Positions a body-portal popup without inheriting the hero's clipping or transforms. */
export function useSearchDropdown({
  open,
  anchorRef,
  panelRef,
  onClose,
  maxHeight = 360,
  minWidth = 280,
}: SearchDropdownOptions): CSSProperties {
  const [position, setPosition] = useState<CSSProperties>(hiddenPosition);
  const closeRef = useRef(onClose);

  useLayoutEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useLayoutEffect(() => {
    if (!open || typeof window === 'undefined') return;
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;

    let frame = 0;
    let disposed = false;
    const gap = 8;
    const gutter = 12;

    const measure = () => {
      frame = 0;
      if (disposed) return;
      const rect = anchor.getBoundingClientRect();
      const viewport = window.visualViewport;
      const viewportLeft = viewport?.offsetLeft ?? 0;
      const viewportTop = viewport?.offsetTop ?? 0;
      const viewportWidth = viewport?.width ?? window.innerWidth;
      const viewportHeight = viewport?.height ?? window.innerHeight;
      const viewportRight = viewportLeft + viewportWidth;
      const viewportBottom = viewportTop + viewportHeight;
      const availableWidth = Math.max(0, viewportWidth - gutter * 2);
      const width = Math.min(Math.max(rect.width, minWidth), availableWidth);
      const heightLimit = Math.max(0, Math.min(maxHeight, viewportHeight - gutter * 2));

      // Measure at the final width, before choosing a side. Reapply the bounded
      // height immediately so ResizeObserver never leaves an oversized panel.
      panel.style.boxSizing = 'border-box';
      panel.style.width = `${width}px`;
      panel.style.maxHeight = `${heightLimit}px`;
      const naturalHeight = Math.max(panel.scrollHeight, panel.getBoundingClientRect().height);
      const wantedHeight = Math.min(naturalHeight, heightLimit);
      const below = Math.max(0, viewportBottom - gutter - rect.bottom - gap);
      const above = Math.max(0, rect.top - gap - viewportTop - gutter);
      const placeAbove = below < wantedHeight && above > below;
      const boundedHeight = Math.min(heightLimit, placeAbove ? above : below);
      const renderedHeight = Math.min(naturalHeight, boundedHeight);
      const left = Math.max(viewportLeft + gutter, Math.min(rect.left, viewportRight - gutter - width));
      const preferredTop = placeAbove ? rect.top - gap - renderedHeight : rect.bottom + gap;
      const top = Math.max(viewportTop + gutter, Math.min(preferredTop, viewportBottom - gutter - renderedHeight));

      panel.style.maxHeight = `${boundedHeight}px`;
      const next: CSSProperties = {
        position: 'fixed',
        top: Math.round(top),
        left: Math.round(left),
        width,
        maxHeight: boundedHeight,
        zIndex: 80,
        visibility: 'visible',
        boxSizing: 'border-box',
      };
      setPosition(current => current.top === next.top
        && current.left === next.left
        && current.width === next.width
        && current.maxHeight === next.maxHeight
        && current.visibility === next.visibility ? current : next);
    };

    const scheduleMeasure = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const onScroll = (event: Event) => {
      if (event.target instanceof Node && panel.contains(event.target)) return;
      scheduleMeasure();
    };
    const onPointerDown = (event: PointerEvent) => {
      const path = event.composedPath();
      if (path.includes(anchor) || path.includes(panel)) return;
      if (event.target instanceof Node && (anchor.contains(event.target) || panel.contains(event.target))) return;
      closeRef.current();
    };

    measure();
    window.addEventListener('resize', scheduleMeasure);
    window.addEventListener('scroll', onScroll, true);
    window.visualViewport?.addEventListener('resize', scheduleMeasure);
    window.visualViewport?.addEventListener('scroll', scheduleMeasure);
    document.addEventListener('pointerdown', onPointerDown, true);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasure);
    observer?.observe(anchor);
    observer?.observe(panel);

    return () => {
      disposed = true;
      if (frame) window.cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', scheduleMeasure);
      window.removeEventListener('scroll', onScroll, true);
      window.visualViewport?.removeEventListener('resize', scheduleMeasure);
      window.visualViewport?.removeEventListener('scroll', scheduleMeasure);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, anchorRef, panelRef, maxHeight, minWidth]);

  return open ? position : hiddenPosition;
}
