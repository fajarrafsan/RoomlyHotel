import { http, SERVICE } from '../lib/http';
import { WishlistItemResponse, WishlistStatusResponse } from '../types/api';

const BASE = `${SERVICE.hotel}/api/wishlists`;

export const wishlistApi = {
  list: () => http.get<WishlistItemResponse[]>(BASE),
  add: (hotelId: number) => http.post<WishlistItemResponse>(`${BASE}/${hotelId}`),
  remove: (hotelId: number) => http.delete<void>(`${BASE}/${hotelId}`),
  status: (hotelId: number) => http.get<WishlistStatusResponse>(`${BASE}/${hotelId}/status`),
};
