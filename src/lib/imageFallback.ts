export const HOTEL_IMAGE_FALLBACK = '/images/seed/hotels/mulia.jpg';
export const ROOM_IMAGE_FALLBACK = '/images/seed/rooms/standard-1.jpg';

export function applyImageFallback(
  event: { currentTarget: HTMLImageElement },
  fallback = HOTEL_IMAGE_FALLBACK
): void {
  const image = event.currentTarget;
  if (image.dataset.fallbackApplied === 'true') return;
  image.dataset.fallbackApplied = 'true';
  image.src = fallback;
}
