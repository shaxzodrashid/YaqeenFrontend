import {
  request,
  normalizePhone,
  tokenStore,
  makeApiError,
  registerDemoHandler
} from './httpClient';
import type {
  AuthUser,
  LoginResponse,
  RefreshResponse
} from './httpClient';

// Dedicated Auth Mock Database
export const demoAuthDb = {
  registeredPhones: new Set<string>(['998901234567', '998901111111', '998907777777']),
  telegramLinkedPhones: new Set<string>(['998901234567', '998907777777']),
  tempTokens: new Map<string, string>(),
  otps: new Map<string, string>(),
  bannedPhones: new Set<string>(['998906666666']),
  pendingPhones: new Set<string>(['998905555555'])
};

// Dedicated Auth Mock Database Handler
registerDemoHandler((path: string, _options: RequestInit, body: any) => {
  // User Login
  if (path === '/auth/login' || path === '/auth/admin/login') {
    const phone = normalizePhone(body.phone_number || '');
    const password = body.password;

    if (demoAuthDb.bannedPhones.has(phone)) {
      throw makeApiError(path, 401, 'account_banned', 'Account has been banned.');
    }
    if (demoAuthDb.pendingPhones.has(phone)) {
      throw makeApiError(path, 401, 'account_pending', 'Account is pending registration.');
    }
    
    if (password === 'wrongpass' || phone.length < 9) {
      throw makeApiError(path, 401, 'invalid_login', 'Invalid credentials');
    }

    const user: AuthUser = {
      id: 'demo-user-id-12345',
      phone_number: phone,
      role: path.includes('admin') ? 'ROP' : 'EMPLOYEE',
      status: 'Open'
    };

    const res: LoginResponse = {
      accessToken: 'demo-jwt-access-token',
      refreshToken: 'demo-refresh-token-hex-80-chars-very-secure',
      user
    };

    tokenStore.save(res.accessToken, res.refreshToken, user);
    return { handled: true, result: res };
  }

  // Token Refresh
  if (path === '/auth/refresh') {
    if (body.refreshToken === 'invalid') {
      throw makeApiError(path, 401, 'invalid_refresh_token', 'Invalid refresh token');
    }
    const res: RefreshResponse = {
      accessToken: 'demo-jwt-new-access-token-' + Math.random(),
      refreshToken: 'demo-new-refresh-token-' + Math.random()
    };
    tokenStore.save(res.accessToken, res.refreshToken);
    return { handled: true, result: res };
  }

  // User Logout
  if (path === '/auth/logout') {
    if (body.refreshToken === 'invalid') {
      throw makeApiError(path, 401, 'invalid_refresh_token', 'Invalid refresh token');
    }
    return { handled: true, result: { message: 'Logged out successfully' } };
  }

  // Register Step 1: Send OTP
  if (path === '/auth/register/send-otp') {
    const phone = normalizePhone(body.phone_number || '');

    if (!demoAuthDb.telegramLinkedPhones.has(phone)) {
      throw makeApiError(path, 400, 'telegram_not_registered', 'Phone number not registered in Telegram OTP bot.');
    }

    if (phone === '998906666666') {
      throw makeApiError(path, 400, 'account_banned', 'Account is banned.');
    }

    demoAuthDb.otps.set(phone, '123456');
    return { handled: true, result: { message: 'OTP message sent successfully.' } };
  }

  // Register Step 2: Verify OTP
  if (path === '/auth/register/verify-otp') {
    const phone = normalizePhone(body.phone_number || '');
    const otp = body.otp;

    const correctOtp = demoAuthDb.otps.get(phone) || '123456';
    if (otp !== correctOtp) {
      throw makeApiError(path, 400, 'invalid_otp', 'The verification code entered is incorrect.');
    }

    const tempToken = 'temp-token-' + Math.random();
    demoAuthDb.tempTokens.set(tempToken, phone);
    return { handled: true, result: { token: tempToken } };
  }

  // Register Step 3: Set Password
  if (path === '/auth/register/set-password') {
    const token = body.token;
    const password = body.password;
    const confirmation = body.password_confirmation;

    if (!demoAuthDb.tempTokens.has(token)) {
      throw makeApiError(path, 400, 'invalid_token', 'The temporary session has expired.');
    }

    if (password !== confirmation) {
      throw makeApiError(path, 400, 'passwords_do_not_match', 'Passwords do not match.');
    }

    const phone = demoAuthDb.tempTokens.get(token)!;
    demoAuthDb.tempTokens.delete(token);
    demoAuthDb.registeredPhones.add(phone);

    return { handled: true, result: { message: 'Registration completed successfully. Your account is now active.' } };
  }

  // Password Reset Step 1: Send OTP
  if (path === '/auth/password-reset/send-otp') {
    const phone = normalizePhone(body.phone_number || '');

    if (!demoAuthDb.telegramLinkedPhones.has(phone)) {
      throw makeApiError(path, 400, 'telegram_not_registered', 'Phone number not linked in Telegram.');
    }
    
    demoAuthDb.otps.set(phone, '123456');
    return { handled: true, result: { message: 'OTP message sent successfully.' } };
  }

  // Password Reset Step 2: Verify OTP
  if (path === '/auth/password-reset/verify-otp') {
    const phone = normalizePhone(body.phone_number || '');
    const otp = body.otp;

    if (otp !== '123456') {
      throw makeApiError(path, 400, 'invalid_otp', 'The OTP code is invalid.');
    }

    const tempToken = 'reset-token-' + Math.random();
    demoAuthDb.tempTokens.set(tempToken, phone);
    return { handled: true, result: { token: tempToken } };
  }

  // Password Reset Step 3: Set Password
  if (path === '/auth/password-reset/set-password') {
    const token = body.token;
    const password = body.password;
    const confirmation = body.password_confirmation;

    if (!demoAuthDb.tempTokens.has(token)) {
      throw makeApiError(path, 400, 'invalid_token', 'The reset token is invalid or expired.');
    }

    if (password !== confirmation) {
      throw makeApiError(path, 400, 'passwords_do_not_match', 'Passwords do not match.');
    }

    demoAuthDb.tempTokens.delete(token);
    return { handled: true, result: { message: 'Password reset successfully.' } };
  }

  // GET /auth/me Profile & Permissions
  if (path === '/auth/me' && (_options.method || 'GET').toUpperCase() === 'GET') {
    const user = tokenStore.getUser() || {
      id: 'demo-user-id-12345',
      phone_number: '998901234567',
      role: 'CEO',
      status: 'Open',
    };

    return {
      handled: true,
      result: {
        id: user.id,
        username: user.phone_number,
        role: user.role,
        permissions: {
          clients: { create: true, read: true, update: true, delete: true },
          employees: { create: true, read: true, update: true, delete: true },
          cargo_registrations: {
            create: true,
            read: true,
            update: true,
            delete: true,
            register_for_everyone: true,
          },
        },
      },
    };
  }

  return null;
});

export const authApi = {
  me: () =>
    request<any>('/auth/me', { method: 'GET' }),

  login: async (phone_number: string, password: string, isAdmin = false) => {
    const res = await request<LoginResponse>(isAdmin ? '/auth/admin/login' : '/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number, password })
    });
    if (res && res.accessToken && res.refreshToken) {
      tokenStore.save(res.accessToken, res.refreshToken, res.user);
    }
    return res;
  },

  logout: async (refreshToken?: string) => {
    const tokenToInvalidate = refreshToken || tokenStore.getRefreshToken();
    try {
      if (tokenToInvalidate) {
        await request<{ message: string }>('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken: tokenToInvalidate })
        });
      }
    } finally {
      tokenStore.clear();
    }
    return { message: 'Logged out successfully' };
  },

  registerSendOtp: (phone_number: string) =>
    request<{ message: string }>('/auth/register/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number })
    }),

  registerVerifyOtp: (phone_number: string, otp: string) =>
    request<{ token: string }>('/auth/register/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number, otp })
    }),

  registerSetPassword: (token: string, password: string, password_confirmation: string) =>
    request<{ message: string }>('/auth/register/set-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, password_confirmation })
    }),

  resetSendOtp: (phone_number: string) =>
    request<{ message: string }>('/auth/password-reset/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number })
    }),

  resetVerifyOtp: (phone_number: string, otp: string) =>
    request<{ token: string }>('/auth/password-reset/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number, otp })
    }),

  resetSetPassword: (token: string, password: string, password_confirmation: string) =>
    request<{ message: string }>('/auth/password-reset/set-password', {
      method: 'POST',
      body: JSON.stringify({ token, password, password_confirmation })
    })
};
