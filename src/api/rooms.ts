import { buildQuery, http, SERVICE } from '../lib/http';
import {
  PagedResponse,
  RoomAmenityGroupResponse,
  RoomAvailabilityResponse,
  RoomCompositionResponse,
  RoomImageResponse,
  RoomPolicyGroupResponse,
  RoomPriceResponse,
  RoomResponse,
  RoomUnitResponse
} from '../types/api';

const BASE = `${SERVICE.room}/api/rooms`;
const ADMIN_BASE = `${SERVICE.room}/api/admin/rooms`;

export interface RoomSearchParams {
  hotelId?: number;
  keyword?: string;
  minCapacity?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export const roomApi = {
  search: (params: RoomSearchParams) =>
    http
      .get<PagedResponse<RoomResponse>>(`${BASE}${buildQuery({ size: 50, ...params })}`)
      .catch(() => ({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 50 })),
  getById: (roomId: number) => http.get<RoomResponse>(`${BASE}/${roomId}`),
  images: (roomId: number) => http.get<RoomImageResponse[]>(`${BASE}/${roomId}/images`).catch(() => []),
  policiesGrouped: (roomId: number) => http.get<RoomPolicyGroupResponse[]>(`${BASE}/${roomId}/policies/grouped`).catch(() => []),
  availability: (roomId: number, from: string, to: string) =>
    http.get<RoomAvailabilityResponse[]>(`${BASE}/${roomId}/availability${buildQuery({ from, to })}`).catch(() => []),
  composition: (roomId: number) => http.get<RoomCompositionResponse[]>(`${BASE}/${roomId}/composition`).catch(() => []),
  amenitiesGrouped: (roomId: number) => http.get<RoomAmenityGroupResponse[]>(`${BASE}/${roomId}/amenities/grouped`).catch(() => []),
  prices: (roomId: number) => http.get<RoomPriceResponse[]>(`${BASE}/${roomId}/prices`).catch(() => []),
  // Admin-only: physical room units, used to assign a specific unit at check-in.
  unitsByRoom: (roomId: number) => http.get<RoomUnitResponse[]>(`${ADMIN_BASE}/${roomId}/units`).catch(() => []),
};
