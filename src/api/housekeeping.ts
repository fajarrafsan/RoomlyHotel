import { buildQuery, http, SERVICE } from '../lib/http';
import {
  CreateHousekeepingTaskRequest,
  HousekeepingTaskFilters,
  HousekeepingTaskResponse,
  UpdateHousekeepingTaskRequest,
} from '../types/api';

const BASE = `${SERVICE.housekeeping}/api/admin/housekeeping`;

export const housekeepingApi = {
  list: (filters: HousekeepingTaskFilters = {}) =>
    http.get<HousekeepingTaskResponse[]>(`${BASE}/tasks${buildQuery({
      status: filters.status,
      hotelId: filters.hotelId,
      assignedToUserId: filters.assignedToUserId,
    })}`),
  pending: () => http.get<HousekeepingTaskResponse[]>(`${BASE}/tasks/pending`),
  byRoomUnit: (roomUnitId: number) =>
    http.get<HousekeepingTaskResponse[]>(`${BASE}/room-units/${roomUnitId}/tasks`),
  create: (payload: CreateHousekeepingTaskRequest) =>
    http.post<HousekeepingTaskResponse>(`${BASE}/tasks`, payload),
  start: (taskId: number, assignedToUserId?: number) =>
    http.patch<HousekeepingTaskResponse>(
      `${BASE}/tasks/${taskId}/start${buildQuery({ assignedToUserId })}`
    ),
  complete: (taskId: number) =>
    http.patch<HousekeepingTaskResponse>(`${BASE}/tasks/${taskId}/complete`),
  cancel: (taskId: number) =>
    http.patch<HousekeepingTaskResponse>(`${BASE}/tasks/${taskId}/cancel`),
  update: (taskId: number, payload: UpdateHousekeepingTaskRequest) =>
    http.patch<HousekeepingTaskResponse>(`${BASE}/tasks/${taskId}`, payload),
};
