import React from 'react';
import { LayoutGrid } from 'lucide-react';
import { RoomPolicyGroup } from '../../types';
import {
  RoomCompositionResponse, RoomAmenityGroupResponse, RoomPriceResponse
} from '../../types/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { label, POLICY_TYPE_LABELS, refundTerms } from '../hotels/detail/policyLabels';
import { AREA_TYPE_LABELS, AREA_TYPE_ICONS, ITEM_TYPE_LABELS } from '../rooms/roomCompositionLabels';
import { getRoomAmenityIcon, AMENITY_GROUP_LABELS } from '../rooms/roomAmenityIcons';

interface RoomDetailGridProps {
  isID: boolean;
  loading: boolean;
  compositionByArea: Record<string, RoomCompositionResponse[]>;
  amenityGroups: RoomAmenityGroupResponse[];
  groupedPolicies: RoomPolicyGroup[];
  specialPrices: RoomPriceResponse[];
}

const AREA_ORDER = ['BEDROOM', 'LIVING_ROOM', 'BATHROOM', 'BALCONY', 'OTHER'];
const AMENITY_ORDER = ['TOP', 'ROOM', 'VIEW', 'BATHROOM', 'FOOD', 'ENTERTAINMENT', 'ACCESSIBILITY', 'SAFETY'];
const POLICY_ORDER = ['CHECK_IN', 'CHECK_OUT', 'BREAKFAST', 'REFUND', 'CHILD', 'EXTRA_BED', 'SMOKING', 'PET', 'GENERAL'];

/** Keys not in the list keep their relative place after the known ones. */
const byOrder = (order: string[]) => (a: string, b: string) => {
  const rank = (key: string) => (order.indexOf(key) === -1 ? order.length : order.indexOf(key));
  return rank(a) - rank(b);
};
const lettersOnly = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '');

const sectionClass = 'min-w-0 rounded-[22px] border border-slate-200 bg-white px-4 py-5 sm:px-6 sm:py-6';
const sectionTitleClass = 'font-serif text-[24px] leading-tight tracking-[-0.02em] text-navy-dark sm:text-[26px]';

export const RoomDetailGrid: React.FC<RoomDetailGridProps> = ({
  isID, loading, compositionByArea, amenityGroups, groupedPolicies, specialPrices,
}) => {
  if (loading) return <RoomDetailGridSkeleton isID={isID} />;

  const areas = Object.entries(compositionByArea)
    .map(([areaType, items]) => [areaType, items.filter((item) => item.itemType !== 'NONE')] as const)
    .filter(([, items]) => items.length > 0)
    .sort(([a], [b]) => byOrder(AREA_ORDER)(a, b));
  const amenities = [...amenityGroups].sort((a, b) => byOrder(AMENITY_ORDER)(a.amenityGroup, b.amenityGroup));
  const policies = [...groupedPolicies].sort((a, b) => byOrder(POLICY_ORDER)(a.policyType, b.policyType));

  if (!areas.length && !amenities.length && !policies.length && !specialPrices.length) return null;

  return (
    <div className="space-y-5 sm:space-y-6" data-room-sections>
      {areas.length > 0 && (
        <section className={sectionClass} aria-labelledby="room-layout-heading">
          <h2 id="room-layout-heading" className={sectionTitleClass}>{isID ? 'Susunan kamar' : 'Room layout'}</h2>
          <div className="mt-5 grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3">
            {areas.map(([areaType, items]) => {
              const AreaIcon = AREA_TYPE_ICONS[areaType as keyof typeof AREA_TYPE_ICONS] ?? LayoutGrid;
              return (
                <div key={areaType} className="min-w-0 rounded-2xl bg-slate-50 p-3.5 [overflow-wrap:anywhere]">
                  <h3 className="flex items-center gap-2.5 text-[15px] font-semibold text-navy-dark">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gold-soft/70 text-gold-dark">
                      <AreaIcon className="size-4" aria-hidden />
                    </span>
                    {label(AREA_TYPE_LABELS as Record<string, { id: string; en: string }>, areaType, isID)}
                  </h3>
                  <ul className="mt-2.5 space-y-1.5 pl-[46px] text-[14.5px] leading-snug text-slate-600">
                    {items.map((item) => (
                      <li key={item.id}>
                        {item.quantity > 1 ? `${item.quantity}x ` : ''}
                        {label(ITEM_TYPE_LABELS as Record<string, { id: string; en: string }>, item.itemType, isID)}
                        {item.isOptional && <span className="text-slate-500"> ({isID ? 'opsional' : 'optional'})</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {amenities.length > 0 && (
        <section className={sectionClass} aria-labelledby="room-amenities-heading">
          <h2 id="room-amenities-heading" className={sectionTitleClass}>{isID ? 'Fasilitas kamar' : 'Room amenities'}</h2>
          <div className="mt-3 divide-y divide-slate-200/70">
            {amenities.map((group) => (
              <div key={group.amenityGroup} className="grid gap-x-6 gap-y-3 py-4 sm:grid-cols-[148px_minmax(0,1fr)]">
                <h3 className="text-sm font-semibold leading-6 text-navy-dark">
                  {label(AMENITY_GROUP_LABELS as Record<string, { id: string; en: string }>, group.amenityGroup, isID)}
                </h3>
                <ul className="grid grid-cols-1 gap-x-5 gap-y-2.5 min-[420px]:grid-cols-2 xl:grid-cols-3">
                  {group.items.map((amenity) => {
                    const Icon = getRoomAmenityIcon(amenity.icon);
                    return (
                      <li key={amenity.amenityId} className="flex min-w-0 items-center gap-2.5 text-[14.5px] leading-6 text-slate-700" title={amenity.description || undefined}>
                        <Icon className="size-4 shrink-0 text-gold" aria-hidden />
                        <span className="min-w-0 [overflow-wrap:anywhere]">{amenity.amenityName}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {policies.length > 0 && (
        <section className={sectionClass} aria-labelledby="room-policies-heading">
          <h2 id="room-policies-heading" className={sectionTitleClass}>{isID ? 'Kebijakan menginap' : 'Stay policies'}</h2>
          <dl className="mt-3 grid gap-x-10 sm:grid-cols-2">
            {policies.map((group) => {
              const policyName = label(POLICY_TYPE_LABELS, group.policyType, isID);
              return (
                <div key={group.policyType} className="min-w-0 border-t border-slate-200/70 py-4 [overflow-wrap:anywhere]">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-gold-dark">{policyName}</dt>
                  <dd className="mt-1.5 space-y-2">
                    {group.items.map((policy) => {
                      const terms = group.policyType === 'REFUND' ? refundTerms(policy, isID) : '';
                      return (
                        <div key={policy.id}>
                          {lettersOnly(policy.title) !== lettersOnly(policyName) && (
                            <p className="text-[15px] font-semibold leading-6 text-navy-dark">{policy.title}</p>
                          )}
                          {terms && <p className={`text-sm font-medium leading-6 ${policy.isRefundable === false ? 'text-rose-700' : 'text-emerald-700'}`}>{terms}</p>}
                          {policy.description && <p className="text-sm leading-6 text-slate-600">{policy.description}</p>}
                        </div>
                      );
                    })}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>
      )}

      {specialPrices.length > 0 && (
        <section className={sectionClass} aria-labelledby="room-rates-heading">
          <h2 id="room-rates-heading" className={sectionTitleClass}>{isID ? 'Harga khusus' : 'Special rates'}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{isID ? 'Harga per malam pada tanggal tertentu.' : 'Nightly rates on selected dates.'}</p>
          <ul className="mt-2 divide-y divide-slate-200/70">
            {specialPrices.map((price) => (
              <li key={price.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3.5">
                <div className="min-w-0 [overflow-wrap:anywhere]">
                  <p className="text-[15px] font-semibold leading-6 text-navy-dark">
                    {formatDate(price.startDate, isID ? 'ID' : 'EN')}
                    {price.endDate !== price.startDate ? ` – ${formatDate(price.endDate, isID ? 'ID' : 'EN')}` : ''}
                  </p>
                  {price.notes && <p className="text-sm leading-5 text-slate-500">{price.notes}</p>}
                </div>
                <p className="text-[15px] font-semibold tabular-nums text-navy-dark">{formatCurrency(price.pricePerNight)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

const pulse = 'animate-pulse rounded-full bg-slate-200/80 motion-reduce:animate-none';

export const RoomDetailGridSkeleton: React.FC<{ isID: boolean }> = ({ isID }) => (
  <div className="space-y-5 sm:space-y-6" aria-busy="true" aria-label={isID ? 'Memuat informasi kamar' : 'Loading room information'}>
    {[0, 1, 2].map((section) => (
      <div key={section} className={sectionClass}>
        <span className={`${pulse} block h-6 w-44`} />
        <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => <span key={item} className={`${pulse} block h-3.5 w-4/5`} />)}
        </div>
      </div>
    ))}
  </div>
);
