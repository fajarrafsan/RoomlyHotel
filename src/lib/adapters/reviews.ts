import { Review } from '../../types';
import { ReviewResponse } from '../../types/api';
import { AVATAR_IMAGES, hashToIndex } from './assets';

export function mapReviewToUI(r: ReviewResponse): Review {
  return {
    id: String(r.id),
    // ReviewResponse only carries a numeric userId — Roomly has no public
    // user-lookup endpoint, so a display name/avatar can't be resolved for real.
    userName: r.isAnonymous ? 'Anonymous Guest' : `Guest #${r.userId}`,
    userAvatar: AVATAR_IMAGES[hashToIndex(r.id, AVATAR_IMAGES.length)],
    rating: r.rating,
    date: r.createdAt ? r.createdAt.slice(0, 10) : '',
    comment: r.comment || '',
    title: r.title || undefined,
    isVerifiedStay: r.isVerifiedStay ?? undefined,
    helpfulCount: r.helpfulCount ?? undefined,
  };
}
