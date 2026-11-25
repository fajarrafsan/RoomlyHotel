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
  hotelId: number | null;
}

export interface AdminOtpChallengeDto {
  challengeId: string;
  expiresInSeconds: number;
}

export interface LoginResultDto {
  otpRequired: boolean;
  otpChallenge?: AdminOtpChallengeDto | null;
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
  hotelId: number | null;
}
