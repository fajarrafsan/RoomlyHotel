import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../lib/http';
import { CreateHotelRequest, HotelResponse, HotelStatus, PropertyType } from '../../types/api/hotel';
import { AdminFormModal, SelectField, TextAreaField, TextField } from './AdminFormModal';

interface HotelFormModalProps {
  isID: boolean;
  /** null = create mode, a hotel = edit mode. */
  hotel: HotelResponse | null;
  onClose: () => void;
  onSaved: (hotel: HotelResponse, isNew: boolean) => void;
}

// The backend takes a LocalTime; it accepts "HH:mm" and returns "HH:mm:ss".
// <input type="time"> only ever wants "HH:mm", so trim on the way in.
const toTimeInput = (value: string | null | undefined) => (value ? value.slice(0, 5) : '');

const emptyForm: CreateHotelRequest & { status: HotelStatus } = {
  name: '', description: '', starRating: 3, phone: '', email: '', website: '',
  country: 'Indonesia', province: '', city: '', district: '', postalCode: '', address: '',
  latitude: null, longitude: null, checkInTime: '14:00', checkOutTime: '12:00',
  thumbnailUrl: '', propertyType: 'HOTEL', status: 'ACTIVE',
};

export const HotelFormModal: React.FC<HotelFormModalProps> = ({ isID, hotel, onClose, onSaved }) => {
  const isEdit = hotel !== null;

  const [form, setForm] = useState(() =>
    hotel
      ? {
          name: hotel.name, description: hotel.description, starRating: hotel.starRating,
          phone: hotel.phone, email: hotel.email ?? '', website: hotel.website ?? '',
          country: hotel.country, province: hotel.province, city: hotel.city,
          district: hotel.district ?? '', postalCode: hotel.postalCode ?? '', address: hotel.address,
          latitude: hotel.latitude, longitude: hotel.longitude,
          checkInTime: toTimeInput(hotel.checkInTime), checkOutTime: toTimeInput(hotel.checkOutTime),
          thumbnailUrl: hotel.thumbnailUrl ?? '', propertyType: hotel.propertyType ?? 'HOTEL',
          status: hotel.status,
        }
      : emptyForm
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Optional string fields are dropped when blank so the backend's @Size/@Email
    // validators never see an empty string where it expects null.
    const payload: CreateHotelRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      starRating: Number(form.starRating),
      phone: form.phone.trim(),
      email: form.email?.trim() || undefined,
      website: form.website?.trim() || undefined,
      country: form.country.trim(),
      province: form.province.trim(),
      city: form.city.trim(),
      district: form.district?.trim() || undefined,
      postalCode: form.postalCode?.trim() || undefined,
      address: form.address.trim(),
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined,
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
      thumbnailUrl: form.thumbnailUrl?.trim() || undefined,
      propertyType: form.propertyType,
    };

    try {
      const saved = isEdit
        ? await adminApi.updateHotel(hotel.id, { ...payload, status: form.status })
        : await adminApi.createHotel(payload);
      onSaved(saved, !isEdit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menyimpan properti.' : 'Failed to save property.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminFormModal
      isID={isID}
      title={isEdit ? (isID ? `Ubah Properti · ${hotel.name}` : `Edit Property · ${hotel.name}`) : (isID ? 'Properti Baru' : 'New Property')}
      subtitle={isEdit ? `PUT /api/admin/hotels/${hotel.id}` : 'POST /api/admin/hotels'}
      submitting={submitting}
      error={error}
      submitLabel={isEdit ? (isID ? 'Simpan Perubahan' : 'Save Changes') : (isID ? 'Buat Properti' : 'Create Property')}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label={isID ? 'Nama Properti' : 'Property Name'} required maxLength={150}
          value={form.name} onChange={(e) => set('name', e.target.value)}
        />
        <SelectField
          label={isID ? 'Tipe Properti' : 'Property Type'}
          value={form.propertyType ?? 'HOTEL'}
          onChange={(e) => set('propertyType', e.target.value as PropertyType)}
          options={[
            { value: 'HOTEL', label: 'Hotel' },
            { value: 'VILLA', label: 'Villa' },
            { value: 'APARTMENT', label: 'Apartment' },
          ]}
        />
      </div>

      <TextAreaField
        label={isID ? 'Deskripsi' : 'Description'} required rows={3}
        value={form.description} onChange={(e) => set('description', e.target.value)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SelectField
          label={isID ? 'Bintang' : 'Star Rating'} required
          value={String(form.starRating)}
          onChange={(e) => set('starRating', Number(e.target.value))}
          options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} ★` }))}
        />
        <TextField
          label="Check-in" required type="time"
          value={form.checkInTime} onChange={(e) => set('checkInTime', e.target.value)}
        />
        <TextField
          label="Check-out" required type="time"
          value={form.checkOutTime} onChange={(e) => set('checkOutTime', e.target.value)}
        />
        {isEdit && (
          <SelectField
            label="Status" required
            value={form.status}
            onChange={(e) => set('status', e.target.value as HotelStatus)}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'UNDER_MAINTENANCE', label: 'Under maintenance' },
            ]}
          />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextField
          label={isID ? 'Telepon' : 'Phone'} required
          value={form.phone} onChange={(e) => set('phone', e.target.value)}
        />
        <TextField
          label="Email" type="email"
          value={form.email} onChange={(e) => set('email', e.target.value)}
        />
        <TextField
          label="Website" maxLength={255} placeholder="https://"
          value={form.website} onChange={(e) => set('website', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextField
          label={isID ? 'Negara' : 'Country'} required
          value={form.country} onChange={(e) => set('country', e.target.value)}
        />
        <TextField
          label={isID ? 'Provinsi' : 'Province'} required
          value={form.province} onChange={(e) => set('province', e.target.value)}
        />
        <TextField
          label={isID ? 'Kota' : 'City'} required
          value={form.city} onChange={(e) => set('city', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <TextField
          label={isID ? 'Kecamatan' : 'District'}
          value={form.district} onChange={(e) => set('district', e.target.value)}
        />
        <TextField
          label={isID ? 'Kode Pos' : 'Postal Code'}
          value={form.postalCode} onChange={(e) => set('postalCode', e.target.value)}
        />
        <TextField
          label={isID ? 'URL Thumbnail' : 'Thumbnail URL'} maxLength={255}
          value={form.thumbnailUrl} onChange={(e) => set('thumbnailUrl', e.target.value)}
        />
      </div>

      <TextAreaField
        label={isID ? 'Alamat Lengkap' : 'Full Address'} required rows={2}
        value={form.address} onChange={(e) => set('address', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Latitude" type="number" step="any"
          value={form.latitude ?? ''}
          onChange={(e) => set('latitude', e.target.value === '' ? null : Number(e.target.value))}
        />
        <TextField
          label="Longitude" type="number" step="any"
          value={form.longitude ?? ''}
          onChange={(e) => set('longitude', e.target.value === '' ? null : Number(e.target.value))}
        />
      </div>
    </AdminFormModal>
  );
};
