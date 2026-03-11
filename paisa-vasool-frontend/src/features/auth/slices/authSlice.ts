import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../services/authService';
import type { LoginPayload, LoginResponse } from '../types';
import axiosInstance from '../../../lib/axios';


export const loginThunk = createAsyncThunk<LoginResponse, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async (payload, { rejectWithValue }) => {
    try {
      return await authService.login(payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Login failed');
    }
  }
);
export const registerThunk = createAsyncThunk(
  'auth/register',
  async (payload: { email: string; password: string }, { rejectWithValue }) => {
    try {
      await authService.register(payload);
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.detail || 'Register failed');
    }
  }
);
export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
    } catch (err: any) {
    }
  }
);

export const verifyAuthThunk = createAsyncThunk(
  'auth/verify',
  async (_, { rejectWithValue }) => {
    try {
      const refreshRes = await axiosInstance.post<{ access_token: string }>(
        '/api/v1/users/refresh'
      );
      const accessToken = refreshRes.data.access_token;
      const meRes = await axiosInstance.get('/api/v1/users/auth/me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      return { user: meRes.data, accessToken };
    } catch {
      return rejectWithValue('Not authenticated');
    }
  }
);

interface AuthState {
  user: { id: string; email: string; role: string; first_name?: string; last_name?: string } | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerifying: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isVerifying: true,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.access_token ?? null;
        state.user = {
          id: action.payload.user_id,
          email: action.payload.email,
          role: action.payload.role ?? 'finance_associate',
        };
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
    builder
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });
    builder
      .addCase(verifyAuthThunk.pending, (state) => {
        state.isVerifying = true;
      })
      .addCase(verifyAuthThunk.fulfilled, (state, action) => {
        state.isVerifying = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.user = {
          ...action.payload.user,
          role: action.payload.user.role ?? 'finance_associate',
        };
      })
      .addCase(verifyAuthThunk.rejected, (state) => {
        state.isVerifying = false;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.user = null;
      });
  },
});

export const { clearError, setAccessToken, logout } = authSlice.actions;
export default authSlice.reducer;