import { buildQuery, http, SERVICE } from '../lib/http';
import { FacilityResponse, HotelImageResponse, HotelResponse, PagedResponse, PropertyType } from '../types/api';

const BASE = `${SERVICE.hotel}/api/hotels`;

export interface HotelSearchParams {
  keyword?: string;
  city?: string;
  propertyType?: PropertyType;
  page?: number;
  size?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export const hotelApi = {
  search: (params: HotelSearchParams = {}) =>
    http.get<PagedResponse<HotelResponse>>(`${BASE}${buildQuery({ size: 50, ...params })}`),
  // Public, ACTIVE-only. Returns 404 for INACTIVE/UNDER_MAINTENANCE/DELETED hotels.
  getById: (id: number) => http.get<HotelResponse>(`${BASE}/${id}`),
  // Public, ACTIVE-only (the hotel itself must be ACTIVE too).
  facilities: (id: number) => http.get<FacilityResponse[]>(`${BASE}/${id}/facilities`),
  // Public gallery for an ACTIVE hotel.
  images: (id: number) => http.get<HotelImageResponse[]>(`${BASE}/${id}/images`),
};

export const facilityApi = {
  // Public catalog (ACTIVE facilities only).
  catalog: () => http.get<FacilityResponse[]>(`${SERVICE.hotel}/api/facilities`),
};
