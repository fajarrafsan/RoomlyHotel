export type HousekeepingTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
export type HousekeepingTaskType = 'CLEANING' | 'INSPECTION' | 'MAINTENANCE';

export interface HousekeepingTaskResponse {
  id: number;
  roomUnitId: number;
  bookingId: number | null;
  hotelId: number | null;
  taskType: HousekeepingTaskType;
  status: HousekeepingTaskStatus;
  assignedToUserId: number | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateHousekeepingTaskRequest {
  roomUnitId: number;
  bookingId?: number;
  hotelId?: number;
  assignedToUserId?: number;
  taskType: HousekeepingTaskType;
  notes?: string;
}

export interface UpdateHousekeepingTaskRequest {
  assignedToUserId?: number;
  status?: HousekeepingTaskStatus;
  taskType?: HousekeepingTaskType;
  notes?: string;
}

export interface HousekeepingTaskFilters {
  status?: HousekeepingTaskStatus;
  hotelId?: number;
  assignedToUserId?: number;
}
