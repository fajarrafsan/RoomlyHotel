// ---------- hotel-service ----------

export type HotelStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'DELETED';
export type PropertyType = 'HOTEL' | 'VILLA' | 'APARTMENT';

/** Body for POST /api/admin/hotels. Mirrors CreateHotelRequest field-for-field. */
export interface CreateHotelRequest {
  name: string;
  description: string;
  starRating: number;
  phone: string;
  email?: string;
  website?: string;
  country: string;
  province: string;
  city: string;
  district?: string;
  postalCode?: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  /** LocalTime — "HH:mm" or "HH:mm:ss". */
  checkInTime: string;
  checkOutTime: string;
  thumbnailUrl?: string;
  propertyType?: PropertyType;
}

/** Body for PUT /api/admin/hotels/{id} — same as create plus a required status. */
export interface UpdateHotelRequest extends CreateHotelRequest {
  status: HotelStatus;
}

export type FacilityCategory =
  | 'GENERAL' | 'INTERNET' | 'FOOD' | 'FITNESS' | 'WELLNESS' | 'RECREATION'
  | 'BUSINESS' | 'TRANSPORTATION' | 'ACCESSIBILITY' | 'FAMILY' | 'SECURITY' | 'DINING';

export interface FacilityResponse {
  id: number;
  name: string;
  icon: string | null;
  category: FacilityCategory;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFacilityRequest {
  name: string;
  icon?: string;
  category: FacilityCategory;
  description?: string;
}

export interface UpdateFacilityRequest extends Partial<CreateFacilityRequest> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface HotelImageResponse {
  id: number;
  hotelId: number;
  imageUrl: string;
  publicId: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface HotelResponse {
  id: number;
  name: string;
  description: string;
  starRating: number;
  phone: string;
  email: string;
  website: string;
  country: string;
  province: string;
  city: string;
  district: string;
  postalCode: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  thumbnailUrl: string | null;
  propertyType: PropertyType | null;
  status: HotelStatus;
  createdAt: string;
  updatedAt: string;
}

// ---------- wishlist-service ----------

export interface WishlistItemResponse {
  id: number;
  hotelId: number;
  createdAt: string;
  hotel: HotelResponse;
}

export interface WishlistStatusResponse {
  hotelId: number;
  wishlisted: boolean;
}
