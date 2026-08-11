import { http, SERVICE } from '../lib/http';
import { LoginRequestDto, LoginResultDto, RegisterRequestDto, UserProfileResponseDto } from '../types/api';

const BASE = `${SERVICE.auth}/api/auth`;

export interface RegisterResponseDto {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export const authApi = {
  register: (payload: RegisterRequestDto) => http.post<RegisterResponseDto>(`${BASE}/register`, payload),
  login: (payload: LoginRequestDto) => http.post<LoginResultDto>(`${BASE}/login`, payload),
  google: (idToken: string) => http.post<LoginResultDto>(`${BASE}/google`, { idToken }),
  // Second factor for ADMIN-role accounts only — login() returns otpRequired
  // instead of tokens, and this completes the login once the emailed code is entered.
  verifyAdminOtp: (email: string, otp: string) => http.post<LoginResultDto>(`${BASE}/admin/verify-otp`, { email, otp }),
  logout: () => http.post<void>(`${BASE}/logout`),
  me: () => http.get<UserProfileResponseDto>(`${BASE}/me`).catch(() => null),
};
