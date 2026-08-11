import React from 'react';
import {
  Sparkles, FileText, BadgePercent
} from 'lucide-react';
import { RoomPolicyGroup } from '../../types';
import {
  RoomCompositionResponse, RoomAmenityGroupResponse, RoomPriceResponse
} from '../../types/api';
import { formatCurrency, formatDate } from '../../lib/utils';
import { label, POLICY_TYPE_LABELS, refundTerms } from '../hotels/detail/policyLabels';
import { AREA_TYPE_LABELS, AREA_TYPE_ICONS, ITEM_TYPE_LABELS, ITEM_TYPE_ICONS } from '../rooms/roomCompositionLabels';
import { getRoomAmenityIcon, AMENITY_GROUP_LABELS } from '../rooms/roomAmenityIcons';

interface RoomDetailGridProps {
  isID: boolean;
  loading: boolean;
  compositionByArea: Record<string, RoomCompositionResponse[]>;
  amenityGroups: RoomAmenityGroupResponse[];
  groupedPolicies: RoomPolicyGroup[];
  specialPrices: RoomPriceResponse[];
}

export const RoomDetailGrid: React.FC<RoomDetailGridProps> = ({
  isID, loading, compositionByArea, amenityGroups, groupedPolicies, specialPrices,
}) => {
  if (loading) return <RoomDetailGridSkeleton />;

  const hasContent =
    Object.keys(compositionByArea).length > 0 ||
    amenityGroups.length > 0 ||
    groupedPolicies.length > 0 ||
    specialPrices.length > 0;

  if (!hasContent) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      {Object.entries(compositionByArea).map(([areaType, items]) => {
        const AreaIcon = AREA_TYPE_ICONS[areaType as keyof typeof AREA_TYPE_ICONS];
        return (
          <div
            key={`comp-${areaType}`}
            className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all space-y-3"
          >
            <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-800">
              <span className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                <AreaIcon className="w-4 h-4 text-slate-500" />
              </span>
              {label(AREA_TYPE_LABELS as Record<string, { id: string; en: string }>, areaType, isID)}
            </div>
            <div className="space-y-2 pl-[42px]">
              {items.map((item) => {
                const ItemIcon = ITEM_TYPE_ICONS[item.itemType];
                return (
                  <div key={item.id} className="flex items-center gap-2 text-[13px] text-slate-500 font-light">
                    <ItemIcon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                    <span>
                      {item.quantity > 1 ? `${item.quantity}x ` : ''}
                      {label(ITEM_TYPE_LABELS as Record<string, { id: string; en: string }>, item.itemType, isID)}
                      {item.isOptional && (
                        <span className="text-slate-300"> ({isID ? 'opsional' : 'optional'})</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {amenityGroups.map((group) => (
        <div
          key={`amen-${group.amenityGroup}`}
          className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-800">
            <span className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-slate-500" />
            </span>
            {label(AMENITY_GROUP_LABELS as Record<string, { id: string; en: string }>, group.amenityGroup, isID)}
          </div>
          <div className="space-y-2 pl-[42px]">
            {group.items.map((am) => {
              const Icon = getRoomAmenityIcon(am.icon);
              return (
                <div
                  key={am.amenityId}
                  className="flex items-center gap-2 text-[13px] text-slate-500 font-light"
                  title={am.description || undefined}
                >
                  <Icon className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                  <span className="truncate">{am.amenityName}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {groupedPolicies.map((group) => (
        <div
          key={`pol-${group.policyType}`}
          className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all space-y-3"
        >
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-800">
            <span className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <FileText className="w-4 h-4 text-slate-500" />
            </span>
            {label(POLICY_TYPE_LABELS, group.policyType, isID)}
          </div>
          <div className="space-y-2 pl-[42px]">
            {group.items.map((p) => (
              <div key={p.id} className="space-y-0.5">
                <span className="text-slate-700 font-light text-[13px]">{p.title}</span>
                {group.policyType === 'REFUND' && refundTerms(p, isID) && (
                  <span className={`block font-medium ${p.isRefundable === false ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {refundTerms(p, isID)}
                  </span>
                )}
                {p.description && (
                  <p className="text-[12px] text-slate-400 font-light leading-relaxed">{p.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {specialPrices.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:border-slate-200 hover:shadow-md transition-all space-y-3">
          <div className="flex items-center gap-2.5 text-[13px] font-semibold text-slate-800">
            <span className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <BadgePercent className="w-4 h-4 text-slate-500" />
            </span>
            {isID ? 'Harga Khusus' : 'Special Rates'}
          </div>
          <div className="space-y-2 pl-[42px]">
            {specialPrices.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-[13px]">
                <div className="min-w-0 space-y-0.5">
                  <span className="font-semibold text-slate-800">
                    {formatDate(p.startDate, isID ? 'ID' : 'EN')}
                    {p.endDate !== p.startDate ? ` – ${formatDate(p.endDate, isID ? 'ID' : 'EN')}` : ''}
                  </span>
                  {p.notes && <span className="text-slate-400 font-light block text-[12px] truncate">{p.notes}</span>}
                </div>
                <span className="font-bold text-slate-900 whitespace-nowrap">{formatCurrency(p.pricePerNight)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const RoomDetailGridSkeleton: React.FC = () => (
  <div className="space-y-6" aria-busy="true" aria-label="Loading room details">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-4"
        >
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse shrink-0" />
            <span className="w-32 h-3 rounded-full bg-slate-100 animate-pulse" />
          </div>
          <div className="space-y-2.5 pl-[42px]">
            <span className="block w-full h-2.5 rounded-full bg-slate-100 animate-pulse" />
            <span className="block w-3/4 h-2.5 rounded-full bg-slate-100 animate-pulse" />
            <span className="block w-5/6 h-2.5 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
    <div className="flex items-center gap-3 px-1">
      <span className="w-5 h-5 rounded-lg bg-slate-100 animate-pulse" />
      <span className="w-40 h-2.5 rounded-full bg-slate-100 animate-pulse" />
    </div>
  </div>
);
