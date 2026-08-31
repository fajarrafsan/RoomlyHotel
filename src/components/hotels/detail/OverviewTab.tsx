import React from 'react';
import { motion } from 'motion/react';
import { LogIn, LogOut, Star, Ban, CheckCircle2, Sparkles, MapPin, Navigation, ExternalLink, Phone, Mail, Globe } from 'lucide-react';
import { Hotel, RoomPolicy } from '../../../types';
import { label, FACILITY_CATEGORY_LABELS } from './policyLabels';

export const OverviewTab: React.FC<{
  hotel: Hotel;
  isID: boolean;
  checkIn: string | null;
  checkOut: string | null;
  anyRefundable: boolean;
  refundPolicies: RoomPolicy[];
  facilitiesByCategory: Record<string, NonNullable<Hotel['facilities']>>;
  mapsUrl: string;
  hasCoords: boolean;
}> = ({ hotel, isID, checkIn, checkOut, anyRefundable, refundPolicies, facilitiesByCategory, mapsUrl, hasCoords }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-navy font-serif">{isID ? 'Tentang properti' : 'About this property'}</h3>
      <p className="text-[15px] text-slate-600 leading-[1.7]">{hotel.description}</p>
    </div>

    {/* Key facts — every one of these is a real field from hotel-service */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div className="p-4 rounded-2xl bg-navy-soft/60 border border-navy-soft space-y-2">
        <LogIn className="w-5 h-5 text-slate-700" />
        <p className="text-[13px] font-semibold text-navy">{isID ? 'Check-in' : 'Check-in'}</p>
        <p className="text-[11px] text-slate-400 font-light">
          {checkIn ? `${isID ? 'Mulai' : 'From'} ${checkIn}` : (isID ? 'Belum diatur' : 'Not set')}
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-navy-soft/60 border border-navy-soft space-y-2">
        <LogOut className="w-5 h-5 text-slate-700" />
        <p className="text-[13px] font-semibold text-navy">{isID ? 'Check-out' : 'Check-out'}</p>
        <p className="text-[11px] text-slate-400 font-light">
          {checkOut ? `${isID ? 'Sebelum' : 'Before'} ${checkOut}` : (isID ? 'Belum diatur' : 'Not set')}
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-navy-soft/60 border border-navy-soft space-y-2">
        <Star className="w-5 h-5 text-slate-700" />
        <p className="text-[13px] font-semibold text-navy">{isID ? 'Kelas hotel' : 'Hotel class'}</p>
        <p className="text-[11px] text-slate-400 font-light">{hotel.stars} {isID ? 'bintang' : 'star'}</p>
      </div>
      <div className="p-4 rounded-2xl bg-navy-soft/60 border border-navy-soft space-y-2">
        <Ban className="w-5 h-5 text-slate-700" />
        <p className="text-[13px] font-semibold text-navy">{isID ? 'Pembatalan' : 'Cancellation'}</p>
        <p className="text-[11px] text-slate-400 font-light">
          {refundPolicies.length === 0
            ? (isID ? 'Cek per kamar' : 'See each room')
            : anyRefundable
            ? (isID ? 'Ada opsi refund' : 'Refundable options')
            : (isID ? 'Non-refundable' : 'Non-refundable')}
        </p>
      </div>
    </div>

    {/* Amenities — grouped by the category hotel-service assigns them */}
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-navy font-serif">
        {isID ? 'Fasilitas & layanan' : 'Amenities & services'}
        {hotel.facilities?.length ? (
          <span className="ml-2 text-[13px] text-slate-400 font-light">{hotel.facilities.length}</span>
        ) : null}
      </h3>

      {Object.keys(facilitiesByCategory).length > 0 ? (
        <div className="space-y-5">
          {Object.entries(facilitiesByCategory).map(([category, items]) => (
            <div key={category} className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {label(FACILITY_CATEGORY_LABELS, category, isID)}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map((f) => (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-700">{f.name}</p>
                      {f.description && (
                        <p className="text-[11px] text-slate-400 font-light leading-relaxed mt-0.5">{f.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : hotel.amenities.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {hotel.amenities.map((amenity, idx) => (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 text-[13px] font-medium text-slate-700">
              <Sparkles className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{amenity}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-slate-400 font-light">
          {isID ? 'Hotel ini belum mendaftarkan fasilitas apa pun.' : 'This property has no facilities listed yet.'}
        </p>
      )}
    </div>

    {/* Location — full address + a maps link that actually works */}
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-navy font-serif">{isID ? 'Lokasi' : 'Location'}</h3>
      <div className="p-5 rounded-2xl bg-navy-soft/60 border border-navy-soft space-y-4">
        <div className="flex items-start gap-3">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-[13px] text-slate-700 font-medium">{hotel.address}</p>
            <p className="text-[12px] text-slate-500 font-light">
              {[hotel.district, hotel.city, hotel.province, hotel.postalCode, hotel.country].filter(Boolean).join(', ')}
            </p>
            {hasCoords && (
              <p className="text-[11px] text-slate-400 font-light">
                {hotel.coordinates.lat}, {hotel.coordinates.lng}
              </p>
            )}
          </div>
        </div>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white text-[12px] font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          {isID ? 'Buka di Google Maps' : 'Open in Google Maps'}
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>
      </div>
    </div>

    {/* Contact — phone / email / website straight from the property record */}
    {(hotel.phone || hotel.email || hotel.website) && (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-navy font-serif">{isID ? 'Kontak properti' : 'Property contact'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {hotel.phone && (
            <a href={`tel:${hotel.phone}`} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-[13px] text-slate-700 font-medium truncate">{hotel.phone}</span>
            </a>
          )}
          {hotel.email && (
            <a href={`mailto:${hotel.email}`} className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-[13px] text-slate-700 font-medium truncate">{hotel.email}</span>
            </a>
          )}
          {hotel.website && (
            <a href={hotel.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
              <Globe className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-[13px] text-slate-700 font-medium truncate">
                {hotel.website.replace(/^https?:\/\//, '')}
              </span>
              <ExternalLink className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
            </a>
          )}
        </div>
      </div>
    )}
  </motion.div>
);
