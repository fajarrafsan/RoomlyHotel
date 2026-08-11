import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { RoomType } from '../../types';
import {
  RoomCompositionResponse, RoomAmenityGroupResponse, RoomPriceResponse,
  RoomImageResponse, RoomPolicyGroupResponse
} from '../../types/api';
import { roomApi } from '../../api/rooms';
import { getTodayDateString } from '../../lib/utils';

export interface RoomDetailData {
  images: RoomImageResponse[];
  policies: RoomPolicyGroupResponse[];
  composition: RoomCompositionResponse[];
  amenityGroups: RoomAmenityGroupResponse[];
  specialPrices: RoomPriceResponse[];
  availableToday: number | null;
  loading: boolean;
  activeImage: number;
  setActiveImage: Dispatch<SetStateAction<number>>;
  gallery: string[];
}

// Must be the LOCAL calendar date: toISOString() converts to UTC, which at
// UTC+7 reports yesterday for any time before 07:00 local — so "today's
// availability" would be fetched for the wrong day every morning.
const today = getTodayDateString;

export function useRoomDetail(room: RoomType | undefined): RoomDetailData {
  const [images, setImages] = useState<RoomImageResponse[]>([]);
  const [policies, setPolicies] = useState<RoomPolicyGroupResponse[]>([]);
  const [composition, setComposition] = useState<RoomCompositionResponse[]>([]);
  const [amenityGroups, setAmenityGroups] = useState<RoomAmenityGroupResponse[]>([]);
  const [specialPrices, setSpecialPrices] = useState<RoomPriceResponse[]>([]);
  const [availableToday, setAvailableToday] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!room) return;
    let cancelled = false;
    setLoading(true);
    setActiveImage(0);
    const rid = Number(room.id);
    const t = today();

    Promise.allSettled([
      roomApi.images(rid),
      roomApi.policiesGrouped(rid),
      roomApi.composition(rid),
      roomApi.amenitiesGrouped(rid),
      roomApi.prices(rid),
      roomApi.availability(rid, t, t),
    ]).then(([imgR, polR, compR, amenR, priceR, availR]) => {
      if (cancelled) return;
      setImages(imgR.status === 'fulfilled' ? imgR.value : []);
      setPolicies(polR.status === 'fulfilled' ? polR.value : []);
      setComposition(compR.status === 'fulfilled' ? compR.value : []);
      setAmenityGroups(amenR.status === 'fulfilled' ? amenR.value : []);
      setSpecialPrices(
        priceR.status === 'fulfilled'
          ? priceR.value.filter((p) => p.status === 'ACTIVE' && p.endDate >= t)
          : []
      );
      setAvailableToday(availR.status === 'fulfilled' ? availR.value[0]?.availableInventory ?? null : null);
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [room?.id]);

  const gallery = images.length
    ? images.map((i) => i.imageUrl)
    : room?.images?.length
    ? room.images
    : room
    ? [room.image]
    : [];

  return {
    images, policies, composition, amenityGroups, specialPrices,
    availableToday, loading, activeImage, setActiveImage, gallery,
  };
}
