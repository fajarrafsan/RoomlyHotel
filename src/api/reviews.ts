import { buildQuery, http, SERVICE } from '../lib/http';
import { CreateReviewRequest, RatingSummaryResponse, ReviewResponse, SpringPage } from '../types/api';

const BASE = SERVICE.review;

export const reviewApi = {
  create: (payload: CreateReviewRequest) => http.post<ReviewResponse>(`${BASE}/api/reviews`, payload),
  // review-service returns raw Spring Data Page<T> (like invoice-service/
  // notification-service), not Roomly's custom PagedResponse<T> wrapper.
  myReviews: (page = 0, size = 20) =>
    http.get<SpringPage<ReviewResponse>>(`${BASE}/api/reviews/me${buildQuery({ page, size })}`),
  byHotel: (hotelId: number, page = 0, size = 20) =>
    http.get<SpringPage<ReviewResponse>>(`${BASE}/api/hotels/${hotelId}/reviews${buildQuery({ page, size })}`),
  hotelRatingSummary: (hotelId: number) =>
    http.get<RatingSummaryResponse>(`${BASE}/api/hotels/${hotelId}/rating-summary`),
};
