import React, { useState } from 'react';
import { adminApi } from '../../api/admin';
import { ApiError } from '../../lib/http';
import { CreateRoomRequest, RoomResponse, RoomStatus } from '../../types/api/room';
import { AdminFormModal, SelectField, TextAreaField, TextField } from './AdminFormModal';

interface RoomFormModalProps {
  isID: boolean;
  hotelId: number;
  hotelName: string;
  /** null = create mode, a room = edit mode. */
  room: RoomResponse | null;
  onClose: () => void;
  onSaved: (room: RoomResponse, isNew: boolean) => void;
}

const emptyForm = {
  roomName: '', description: '', basePrice: 0, maxOccupancy: 2,
  capacityAdult: 2, capacityChild: 0, totalBeds: 1,
  roomSize: null as number | null, roomSizeUnit: 'm2', viewType: '',
  status: 'ACTIVE' as RoomStatus,
};

export const RoomFormModal: React.FC<RoomFormModalProps> = ({
  isID, hotelId, hotelName, room, onClose, onSaved,
}) => {
  const isEdit = room !== null;

  const [form, setForm] = useState(() =>
    room
      ? {
          roomName: room.roomName, description: room.description ?? '',
          basePrice: room.basePrice, maxOccupancy: room.maxOccupancy,
          capacityAdult: room.capacityAdult, capacityChild: room.capacityChild,
          totalBeds: room.totalBeds, roomSize: room.roomSize,
          roomSizeUnit: room.roomSizeUnit ?? 'm2', viewType: room.viewType ?? '',
          status: room.status,
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

    const payload: CreateRoomRequest = {
      roomName: form.roomName.trim(),
      description: form.description.trim() || undefined,
      basePrice: Number(form.basePrice),
      maxOccupancy: Number(form.maxOccupancy),
      capacityAdult: Number(form.capacityAdult),
      capacityChild: Number(form.capacityChild),
      totalBeds: Number(form.totalBeds),
      roomSize: form.roomSize ?? undefined,
      roomSizeUnit: form.roomSizeUnit?.trim() || undefined,
      viewType: form.viewType?.trim() || undefined,
    };

    try {
      const saved = isEdit
        ? await adminApi.updateRoom(room.id, { ...payload, status: form.status })
        : await adminApi.createRoom(hotelId, payload);
      onSaved(saved, !isEdit);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (isID ? 'Gagal menyimpan kamar.' : 'Failed to save room.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminFormModal
      isID={isID}
      title={isEdit ? (isID ? 'Ubah tipe kamar' : 'Edit room type') : (isID ? 'Tambah tipe kamar' : 'Add room type')}
      subtitle={room?.roomName ?? hotelName}
      submitting={submitting}
      error={error}
      submitLabel={isEdit ? (isID ? 'Simpan Perubahan' : 'Save Changes') : (isID ? 'Buat Kamar' : 'Create Room')}
      onClose={onClose}
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField
          label={isID ? 'Nama Tipe Kamar' : 'Room Type Name'} required maxLength={150}
          value={form.roomName} onChange={(e) => set('roomName', e.target.value)}
        />
        <TextField
          label={isID ? 'Harga Dasar / Malam (IDR)' : 'Base Price / Night (IDR)'} required
          type="number" min={1} step="any"
          value={form.basePrice} onChange={(e) => set('basePrice', Number(e.target.value))}
        />
      </div>

      <TextAreaField
        label={isID ? 'Deskripsi' : 'Description'} rows={3}
        value={form.description} onChange={(e) => set('description', e.target.value)}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <TextField
          label={isID ? 'Kapasitas Maks' : 'Max Occupancy'} required type="number" min={1}
          value={form.maxOccupancy} onChange={(e) => set('maxOccupancy', Number(e.target.value))}
        />
        <TextField
          label={isID ? 'Dewasa' : 'Adults'} required type="number" min={1}
          value={form.capacityAdult} onChange={(e) => set('capacityAdult', Number(e.target.value))}
        />
        <TextField
          label={isID ? 'Anak' : 'Children'} required type="number" min={0}
          value={form.capacityChild} onChange={(e) => set('capacityChild', Number(e.target.value))}
        />
        <TextField
          label={isID ? 'Tempat Tidur' : 'Total Beds'} required type="number" min={1}
          value={form.totalBeds} onChange={(e) => set('totalBeds', Number(e.target.value))}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <TextField
          label={isID ? 'Luas' : 'Room Size'} type="number" step="any" min={0}
          value={form.roomSize ?? ''}
          onChange={(e) => set('roomSize', e.target.value === '' ? null : Number(e.target.value))}
        />
        <TextField
          label={isID ? 'Satuan' : 'Size Unit'} maxLength={20}
          value={form.roomSizeUnit} onChange={(e) => set('roomSizeUnit', e.target.value)}
        />
        <TextField
          label={isID ? 'Pemandangan' : 'View Type'} maxLength={50} placeholder={isID ? 'mis. Ocean' : 'e.g. Ocean'}
          value={form.viewType} onChange={(e) => set('viewType', e.target.value)}
        />
        {isEdit && (
          <SelectField
            label="Status"
            value={form.status}
            onChange={(e) => set('status', e.target.value as RoomStatus)}
            options={[
              { value: 'ACTIVE', label: isID ? 'Aktif' : 'Active' },
              { value: 'INACTIVE', label: isID ? 'Nonaktif' : 'Inactive' },
              { value: 'UNDER_MAINTENANCE', label: isID ? 'Dalam perawatan' : 'Under maintenance' },
            ]}
          />
        )}
      </div>
    </AdminFormModal>
  );
};
