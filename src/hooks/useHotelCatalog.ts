import { useCallback, useEffect, useRef, useState } from 'react';
import { hotelApi } from '../api/hotels';
import { roomApi } from '../api/rooms';
import { reviewApi } from '../api/reviews';
import {
  mapFacilityToUI,
  mapHotelToUI,
  mapPolicyGroupsToUI,
  mapReviewToUI,
  mapRoomToUI
} from '../lib/adapters';
import { Hotel, RoomType } from '../types';
import { RoomResponse } from '../types/api';
import { getTodayDateString } from '../lib/utils';

const ROOM_PAGE_SIZE = 200;

// One catalog-wide room query grouped by hotel on the client. Asking once per
// hotel sent ~30 requests per page load into room-service's per-client rate
// limit, so a couple of refreshes left hotel cards at "Rp 0" with no rooms.
async function loadRoomsByHotel(): Promise<Map<number, RoomResponse[]>> {
  const byHotel = new Map<number, RoomResponse[]>();
  for (let page = 0; page < 20; page++) {
    const { content } = await roomApi.search({ page, size: ROOM_PAGE_SIZE });
    for (const room of content) {
      const rooms = byHotel.get(room.hotelId) ?? [];
      rooms.push(room);
      byHotel.set(room.hotelId, rooms);
    }
    if (content.length < ROOM_PAGE_SIZE) break;
  }
  return byHotel;
}

// Fetches every hotel plus its room catalog (for a real "from Rp X" price) and
// rating summary (for real stars), so the catalog is usable without opening detail.
async function loadHotelCatalog(): Promise<Hotel[]> {
  const [paged, roomsByHotel] = await Promise.all([
    hotelApi.search({ size: 50 }),
    loadRoomsByHotel().catch((err) => {
      console.error('Failed to load room catalog', err);
      return new Map<number, RoomResponse[]>();
    }),
  ]);

  return Promise.all(
    paged.content.map(async (h) => {
      const [ratingResult] = await Promise.allSettled([reviewApi.hotelRatingSummary(h.id)]);

      const rooms = roomsByHotel.get(h.id) ?? [];
      const minPrice = rooms.length ? Math.min(...rooms.map((r) => r.basePrice)) : 0;
      const rating = ratingResult.status === 'fulfilled' ? ratingResult.value : null;

      const hotel = mapHotelToUI(h, {
        pricePerNight: minPrice,
        rating: rating?.averageRating ?? 0,
        reviewsCount: rating?.totalReviews ?? 0,
      });
      hotel.rooms = rooms.map((r) => mapRoomToUI(r));
      return hotel;
    })
  );
}

// Enriches a single hotel's rooms with images/policies/live availability, and
// loads its real reviews — deferred until the user actually opens the detail
// modal, since these are per-room fan-out calls not worth doing for the whole list.
async function enrichHotelDetail(hotel: Hotel): Promise<Hotel> {
  // Wishlist snapshots can refer to hotels outside the first catalog page.
  // Their basic DTO has no room list, so fetch that hotel's rooms on demand.
  let rooms = hotel.rooms;
  if (rooms.length === 0) {
    const rows: RoomResponse[] = [];
    for (let page = 0; page < 20; page++) {
      const { content } = await roomApi.search({ hotelId: Number(hotel.id), page, size: ROOM_PAGE_SIZE });
      rows.push(...content);
      if (content.length < ROOM_PAGE_SIZE) break;
    }
    rooms = rows.map(room => mapRoomToUI(room));
  }
  // Local calendar date, not toISOString() — at UTC+7 the UTC form reports
  // yesterday before 07:00 local, which would fetch the wrong day's availability.
  const today = getTodayDateString();
  const roomIds = rooms.map((r) => Number(r.id));

  const [imageResults, policyResults, availResults, reviewsPage, ratingSummary, facilities, hotelImages] = await Promise.all([
    Promise.allSettled(roomIds.map((id) => roomApi.images(id))),
    Promise.allSettled(roomIds.map((id) => roomApi.policiesGrouped(id))),
    Promise.allSettled(roomIds.map((id) => roomApi.availability(id, today, today))),
    reviewApi.byHotel(Number(hotel.id), 0, 20).catch(() => ({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 })),
    reviewApi.hotelRatingSummary(Number(hotel.id)).catch(() => null),
    hotelApi.facilities(Number(hotel.id)).catch(() => []),
    hotelApi.images(Number(hotel.id)).catch(() => []),
  ]);

  const enrichedRooms: RoomType[] = rooms.map((room, idx) => {
    const images = imageResults[idx].status === 'fulfilled' ? (imageResults[idx] as PromiseFulfilledResult<Awaited<ReturnType<typeof roomApi.images>>>).value : [];
    const policies = policyResults[idx].status === 'fulfilled' ? (policyResults[idx] as PromiseFulfilledResult<Awaited<ReturnType<typeof roomApi.policiesGrouped>>>).value : [];
    const avail = availResults[idx].status === 'fulfilled' ? (availResults[idx] as PromiseFulfilledResult<Awaited<ReturnType<typeof roomApi.availability>>>).value : [];

    // Primary image first, then by the display order the admin set.
    const ordered = [...images].sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
    });
    const features = policies.flatMap((g) => g.items.map((i) => i.title)).filter(Boolean);
    const todayAvail = avail[0];

    return {
      ...room,
      image: ordered[0]?.imageUrl || room.image,
      images: ordered.length ? ordered.map((img) => img.imageUrl) : room.images,
      features: features.length ? features : room.features,
      policies: policies.length ? mapPolicyGroupsToUI(policies) : room.policies,
      availableRooms: todayAvail?.availableInventory,
      totalInventory: todayAvail?.totalInventory,
      availabilityStatus: todayAvail?.status,
    };
  });

  const reviews = reviewsPage.content.map(mapReviewToUI);

  // Real hotel-level facilities from hotel-service's catalog (name + category +
  // icon + description); fall back to room-policy titles only if this hotel
  // genuinely has none assigned yet.
  const facilityList = facilities.map(mapFacilityToUI);
  const amenities = facilityList.length
    ? facilityList.map((f) => f.name)
    : Array.from(new Set(enrichedRooms.flatMap((r) => r.features))).slice(0, 8);

  const orderedHotelImages = [...hotelImages].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
    return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
  });
  const primaryHotelImage = orderedHotelImages[0]?.imageUrl || hotel.image;

  // Put real hotel photography first, then room photography, de-duplicated.
  const gallery = Array.from(
    new Set([
      ...orderedHotelImages.map((item) => item.imageUrl),
      primaryHotelImage,
      ...enrichedRooms.flatMap((r) => r.images ?? [r.image]),
    ])
  ).filter(Boolean).slice(0, 15);
  const roomPrices = enrichedRooms.map(room => room.pricePerNight).filter(price => Number.isFinite(price) && price > 0);

  return {
    ...hotel,
    image: primaryHotelImage,
    pricePerNight: roomPrices.length ? Math.min(...roomPrices) : hotel.pricePerNight,
    rooms: enrichedRooms,
    reviews,
    amenities,
    facilities: facilityList.length ? facilityList : hotel.facilities,
    gallery: gallery.length ? gallery : hotel.gallery,
    rating: ratingSummary?.averageRating ?? hotel.rating,
    reviewsCount: ratingSummary?.totalReviews ?? hotel.reviewsCount,
    ratingBreakdown: ratingSummary
      ? {
          1: ratingSummary.rating1Count,
          2: ratingSummary.rating2Count,
          3: ratingSummary.rating3Count,
          4: ratingSummary.rating4Count,
          5: ratingSummary.rating5Count
        }
      : hotel.ratingBreakdown,
  };
}

export function useHotelCatalog() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hotelsLoading, setHotelsLoading] = useState(true);
  const [hotelsError, setHotelsError] = useState<string | null>(null);
  const [selectedHotelForModal, setSelectedHotelForModal] = useState<Hotel | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const enrichedHotelsRef = useRef<Map<string, Hotel>>(new Map());
  const refreshHotels = useCallback(() => setCatalogRevision(revision => revision + 1), []);

  // Open the detail modal and flip into loading synchronously (before the
  // enrich effect runs) so the skeleton shows from the very first frame.
  const openHotelDetail = (hotel: Hotel) => {
    const cached = enrichedHotelsRef.current.get(hotel.id);
    setSelectedHotelForModal(cached ?? hotel);
    setDetailLoadingId(cached ? null : hotel.id);
  };

  // Load on mount and manual retry; failed refreshes retain the last catalog.
  useEffect(() => {
    let cancelled = false;
    setHotelsLoading(true);
    setHotelsError(null);
    loadHotelCatalog()
      .then((list) => {
        if (!cancelled) {
          enrichedHotelsRef.current.clear();
          setHotels(list);
        }
      })
      .catch((err) => {
        console.error('Failed to load hotel catalog', err);
        if (!cancelled) setHotelsError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setHotelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [catalogRevision]);

  // Lazily enrich a hotel with rooms/images/policies/reviews the first time it's opened.
  useEffect(() => {
    const hotel = selectedHotelForModal;
    if (!hotel || enrichedHotelsRef.current.has(hotel.id)) return;
    let cancelled = false;
    setDetailLoadingId(hotel.id);
    enrichHotelDetail(hotel)
      .then((enriched) => {
        if (cancelled) return;
        enrichedHotelsRef.current.set(hotel.id, enriched);
        setHotels((prev) => prev.map((h) => (h.id === enriched.id ? enriched : h)));
        setSelectedHotelForModal((prev) => (prev && prev.id === enriched.id ? enriched : prev));
      })
      .catch((err) => console.error('Failed to load hotel detail', err))
      .finally(() => {
        if (!cancelled) setDetailLoadingId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedHotelForModal?.id]);

  return {
    hotels,
    hotelsLoading,
    hotelsError,
    refreshHotels,
    selectedHotelForModal,
    setSelectedHotelForModal,
    openHotelDetail,
    detailLoadingId,
  };
}
