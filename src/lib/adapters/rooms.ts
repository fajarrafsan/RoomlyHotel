import { RoomPolicyGroup, RoomType } from '../../types';
import { RoomImageResponse, RoomPolicyGroupResponse, RoomResponse } from '../../types/api';
import { ROOM_FALLBACK_IMAGES, hashToIndex } from './assets';

export function mapPolicyGroupsToUI(groups: RoomPolicyGroupResponse[]): RoomPolicyGroup[] {
  return groups.map((group) => ({
    policyType: group.policyType,
    items: group.items.map((item) => ({
      id: String(item.id),
      policyType: item.policyType,
      title: item.title,
      description: item.description || undefined,
      isRefundable: item.isRefundable ?? undefined,
      freeCancelDays: item.freeCancelDays ?? undefined,
      feeType: item.feeType || undefined,
      feeValue: item.feeValue ?? undefined,
    })),
  }));
}

export function mapRoomToUI(
  room: RoomResponse,
  images: RoomImageResponse[] = [],
  policyGroups: RoomPolicyGroupResponse[] = [],
  availableRooms?: number
): RoomType {
  const ordered = [...images].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });
  const features = policyGroups.flatMap((group) => group.items.map((item) => item.title)).filter(Boolean);

  return {
    id: String(room.id),
    name: room.roomName,
    size: room.roomSize ? `${room.roomSize} ${room.roomSizeUnit || 'm²'}` : '—',
    // Roomly's RoomResponse has no bed-configuration field, only a bed count.
    bedType: `${room.totalBeds} Bed${room.totalBeds > 1 ? 's' : ''}`,
    maxOccupancy: room.maxOccupancy,
    pricePerNight: room.basePrice,
    image: ordered[0]?.imageUrl || ROOM_FALLBACK_IMAGES[hashToIndex(room.id, ROOM_FALLBACK_IMAGES.length)],
    features,
    availableRooms,

    description: room.description || undefined,
    viewType: room.viewType || undefined,
    capacityAdult: room.capacityAdult ?? undefined,
    capacityChild: room.capacityChild ?? undefined,
    images: ordered.map((img) => img.imageUrl),
    policies: policyGroups.length ? mapPolicyGroupsToUI(policyGroups) : undefined,
  };
}
