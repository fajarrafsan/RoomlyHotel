// ---------- review-service ----------

export type ReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';

export interface CreateReviewRequest {
  bookingId: number;
  rating: number;
  title?: string;
  comment?: string;
  isAnonymous?: boolean;
}

export interface ReviewResponse {
  id: number;
  reviewCode: string;
  bookingId: number;
  userId: number;
  hotelId: number;
  roomId: number | null;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  isVerifiedStay: boolean;
  isAnonymous: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummaryResponse {
  averageRating: number;
  totalReviews: number;
  rating1Count: number;
  rating2Count: number;
  rating3Count: number;
  rating4Count: number;
  rating5Count: number;
}
