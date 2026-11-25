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
  google: async (idToken: string) => {
    const signal = AbortSignal.timeout(45000);
    try {
      return await http.post<LoginResultDto>(`${BASE}/google`, { idToken }, signal);
    } catch (error) {
      throw signal.aborted ? signal.reason : error;
    }
  },
  // Second factor for ADMIN-role accounts only — login() returns otpRequired
  // instead of tokens, and this completes the login once the emailed code is entered.
  verifyAdminOtp: (email: string, otp: string) => http.post<LoginResultDto>(`${BASE}/admin/verify-otp`, { email, otp }),
  resendAdminOtp: (email: string, challengeId: string) => http.post<LoginResultDto>(
    `${BASE}/admin/resend-otp`, { email, challengeId }, AbortSignal.timeout(45000),
  ),
  logout: () => http.post<void>(`${BASE}/logout`),
  me: () => http.get<UserProfileResponseDto>(`${BASE}/me`),
};
