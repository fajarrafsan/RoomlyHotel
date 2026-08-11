// ---------- auth-service ----------

export type Role = 'ADMIN' | 'RECEPTIONIST' | 'HOUSEKEEPING' | 'MAINTENANCE' | 'CUSTOMER';

export interface RegisterRequestDto {
  fullName: string;
  email: string;
  password: string;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
}

export interface LoginResultDto {
  otpRequired: boolean;
  message: string;
  user: AuthResponseDto;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface UserProfileResponseDto {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
}
