import { useEffect, useState } from 'react';
import type { RoomType } from '../../types';
import type {
  RoomCompositionResponse, RoomAmenityGroupResponse, RoomPriceResponse, RoomImageResponse, RoomPolicyGroupResponse,
} from '../../types/api';
import { roomApi } from '../../api/rooms';
import { getTodayDateString } from '../../lib/utils';

const emptyDetails = {
  policies: [] as RoomPolicyGroupResponse[],
  composition: [] as RoomCompositionResponse[],
  amenityGroups: [] as RoomAmenityGroupResponse[],
  specialPrices: [] as RoomPriceResponse[],
  availableToday: null as number | null,
};

export function useRoomDetail(room: RoomType | undefined) {
  const roomId = room?.id;
  const [photos, setPhotos] = useState<{ roomId: string; rows: RoomImageResponse[] } | null>(null);
  const [details, setDetails] = useState<{ roomId: string; data: typeof emptyDetails } | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    const rid = Number(roomId);
    const date = getTodayDateString();

    roomApi.images(rid).then(rows => {
      if (active) setPhotos({ roomId, rows });
    }).catch(() => {
      if (active) setPhotos({ roomId, rows: [] });
    });

    void Promise.allSettled([
      roomApi.policiesGrouped(rid),
      roomApi.composition(rid),
      roomApi.amenitiesGrouped(rid),
      roomApi.prices(rid),
      roomApi.availability(rid, date, date),
    ]).then(([policyResult, layoutResult, amenityResult, priceResult, availabilityResult]) => {
      if (!active) return;
      setDetails({ roomId, data: {
        policies: policyResult.status === 'fulfilled' ? policyResult.value : [],
        composition: layoutResult.status === 'fulfilled' ? layoutResult.value : [],
        amenityGroups: amenityResult.status === 'fulfilled' ? amenityResult.value : [],
        specialPrices: priceResult.status === 'fulfilled'
          ? priceResult.value.filter(price => price.status === 'ACTIVE' && price.endDate >= date)
          : [],
        availableToday: availabilityResult.status === 'fulfilled'
          ? availabilityResult.value[0]?.availableInventory ?? null
          : null,
      } });
    });
    return () => { active = false; };
  }, [roomId]);

  const fetchedPhotos = photos && photos.roomId === roomId ? photos.rows : [];
  const orderedPhotos = fetchedPhotos.length > 0
    ? [...fetchedPhotos].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map(photo => photo.imageUrl)
    : room?.images ?? [];
  const pictures = [...new Set(orderedPhotos.filter(Boolean))];
  const galleryLoading = Boolean(roomId && photos?.roomId !== roomId && !pictures.length);
  const illustrated = !galleryLoading && pictures.length === 0 && !!room?.image;
  const currentDetails = details?.roomId === roomId ? details?.data : undefined;

  return {
    ...(currentDetails ?? emptyDetails),
    loading: Boolean(roomId && !currentDetails),
    galleryLoading,
    illustrated,
    gallery: illustrated && room ? [room.image] : pictures,
  };
}
