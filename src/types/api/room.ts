// ---------- room-service ----------

export type RoomStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE' | 'DELETED';
export type RoomPolicyType =
  | 'CHECK_IN' | 'CHECK_OUT' | 'BREAKFAST' | 'EXTRA_BED' | 'REFUND' | 'SMOKING' | 'PET' | 'CHILD' | 'GENERAL';

export interface RoomResponse {
  id: number;
  hotelId: number;
  hotelName: string | null;
  roomName: string;
  description: string;
  basePrice: number;
  maxOccupancy: number;
  capacityAdult: number;
  capacityChild: number;
  totalBeds: number;
  roomSize: number | null;
  roomSizeUnit: string | null;
  viewType: string | null;
  status: RoomStatus;
  policies: RoomPolicyGroupResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomImageResponse {
  id: number;
  roomId: number;
  imageUrl: string;
  publicId: string;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoomPolicyResponse {
  id: number;
  roomId: number;
  roomName: string;
  policyType: RoomPolicyType;
  title: string;
  description: string;
  displayOrder: number;
  isRefundable: boolean;
  freeCancelDays: number | null;
  feeType: string;
  feeValue: number | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface RoomPolicyGroupResponse {
  policyType: RoomPolicyType;
  items: RoomPolicyResponse[];
}

export type RoomAreaType = 'BEDROOM' | 'LIVING_ROOM' | 'BATHROOM' | 'BALCONY' | 'OTHER';
export type RoomItemType =
  | 'KING_BED' | 'QUEEN_BED' | 'DOUBLE_BED' | 'SINGLE_BED' | 'SOFA_BED'
  | 'SHOWER' | 'BATHTUB' | 'TOILET' | 'SINK' | 'NONE' | 'OTHER';

export interface RoomCompositionResponse {
  id: number;
  roomId: number;
  roomName: string;
  areaType: RoomAreaType;
  label: string;
  itemType: RoomItemType;
  quantity: number;
  isOptional: boolean;
  displayOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AmenityGroup = 'TOP' | 'ROOM' | 'BATHROOM' | 'VIEW' | 'FOOD' | 'ACCESSIBILITY' | 'SAFETY' | 'ENTERTAINMENT';

export interface RoomAmenityResponse {
  amenityId: number;
  amenityName: string;
  icon: string;
  amenityGroup: AmenityGroup;
  description: string | null;
  amenityDisplayOrder: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomAmenityGroupResponse {
  amenityGroup: AmenityGroup;
  items: RoomAmenityResponse[];
}

export type RoomPriceStatus = 'ACTIVE' | 'INACTIVE';

export interface RoomPriceResponse {
  id: number;
  roomId: number;
  roomName: string;
  startDate: string;
  endDate: string;
  pricePerNight: number;
  status: RoomPriceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomAvailabilityResponse {
  id: number;
  roomId: number;
  roomName: string;
  availabilityDate: string;
  totalInventory: number;
  availableInventory: number;
  reservedInventory: number;
  maintenanceInventory: number;
  status: RoomAvailabilityStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type RoomUnitStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'DIRTY' | 'CLEANING' | 'MAINTENANCE' | 'OUT_OF_ORDER' | 'DELETED';

export type RoomAvailabilityStatus = 'AVAILABLE' | 'LIMITED' | 'SOLD_OUT' | 'MAINTENANCE' | 'CLOSED';
export type AmenityStatus = 'ACTIVE' | 'INACTIVE';

/**
 * System-wide physical room-unit counts — GET /api/admin/rooms/inventory-summary.
 * Capacity KPIs read from this rather than estimating from the hotel catalog.
 */
export interface RoomInventorySummaryResponse {
  totalUnits: number;
  availableUnits: number;
  occupiedUnits: number;
  reservedUnits: number;
  outOfServiceUnits: number;
  housekeepingUnits: number;
  roomTypesWithUnits: number;
}
export type RefundFeeType = 'NONE' | 'PERCENT' | 'FULL' | 'FIRST_NIGHT';

/** Amenity master record — /api/amenities (read) and /api/admin/amenities (write). */
export interface AmenityResponse {
  id: number;
  name: string;
  icon: string | null;
  amenityGroup: AmenityGroup;
  description: string | null;
  displayOrder: number;
  status: AmenityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAmenityRequest {
  name: string;
  icon?: string;
  amenityGroup: AmenityGroup;
  description?: string;
  displayOrder?: number;
}

export interface UpdateAmenityRequest extends Partial<CreateAmenityRequest> {
  status?: AmenityStatus;
}

/** Seasonal price override for a date range — POST /api/admin/rooms/{id}/prices. */
export interface CreateRoomPriceRequest {
  startDate: string;
  endDate: string;
  pricePerNight: number;
  notes?: string;
}

export interface UpdateRoomPriceRequest extends Partial<CreateRoomPriceRequest> {
  status?: RoomPriceStatus;
}

export interface CreateRoomPolicyRequest {
  policyType: RoomPolicyType;
  title?: string;
  description?: string;
  displayOrder?: number;
  isRefundable?: boolean;
  freeCancelDays?: number | null;
  feeType?: RefundFeeType;
  feeValue?: number | null;
}

export interface UpdateRoomPolicyRequest extends Partial<CreateRoomPolicyRequest> {
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface CreateRoomCompositionRequest {
  areaType: RoomAreaType;
  label: string;
  itemType: RoomItemType;
  quantity: number;
  isOptional: boolean;
  displayOrder?: number;
  notes?: string;
}

export type UpdateRoomCompositionRequest = Partial<CreateRoomCompositionRequest>;

/** Body for PATCH on both room and hotel image endpoints. */
export interface UpdateImageRequest {
  altText?: string;
  displayOrder?: number;
  isPrimary?: boolean;
}

/**
 * Body for POST /api/admin/rooms/{roomId}/availability (upsert, one date).
 *
 * Note there is deliberately no totalInventory field: room-service derives the
 * total from how many physical units the room has, then computes
 * availableInventory = total - reserved - maintenance (clamped at 0). The
 * maintenance figure sent here is also raised to at least the number of
 * OUT_OF_ORDER units, so the saved row can differ from what was submitted.
 */
export interface RoomAvailabilityUpsertRequest {
  /** ISO date; the backend rejects anything in the past (@FutureOrPresent). */
  availabilityDate: string;
  reservedInventory: number;
  maintenanceInventory: number;
  /** Optional override — otherwise the backend resolves the status itself. */
  status?: RoomAvailabilityStatus;
  notes?: string;
}

/** Body for POST /api/admin/hotels/{hotelId}/rooms. */
export interface CreateRoomRequest {
  roomName: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  capacityAdult: number;
  capacityChild: number;
  totalBeds: number;
  roomSize?: number | null;
  roomSizeUnit?: string;
  viewType?: string;
}

/** Body for PATCH /api/admin/hotels/rooms/{roomId} — every field optional. */
export interface UpdateRoomRequest extends Partial<CreateRoomRequest> {
  status?: RoomStatus;
}

/** Body for POST /api/admin/rooms/{roomId}/units (and each item of the bulk form). */
export interface CreateRoomUnitRequest {
  roomNumber: string;
  floor?: number | null;
  status?: RoomUnitStatus;
  notes?: string;
}

export type UpdateRoomUnitRequest = Partial<CreateRoomUnitRequest>;

export interface RoomUnitResponse {
  id: number;
  roomId: number;
  roomName: string;
  roomNumber: string;
  floor: number | null;
  status: RoomUnitStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
