import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardService } from '../services/dashboardService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { DashboardState } from '../types';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchDashboardSummaryThunk = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.fetchSummary();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchRecentMatchesThunk = createAsyncThunk(
  'dashboard/fetchRecentMatches',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.fetchRecentMatches();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchDashboardStatsThunk = createAsyncThunk(
  'dashboard/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await dashboardService.fetchStats();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState: DashboardState = {
  summary: null,
  recentMatches: [],
  stats: null,
  loading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboardError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // summary
    builder
      .addCase(fetchDashboardSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummaryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload;
      })
      .addCase(fetchDashboardSummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // recentMatches
    builder
      .addCase(fetchRecentMatchesThunk.fulfilled, (state, action) => {
        state.recentMatches = action.payload;
      });

    // stats
    builder
      .addCase(fetchDashboardStatsThunk.fulfilled, (state, action) => {
        state.stats = action.payload;
      });
  },
});

export const { clearDashboardError } = dashboardSlice.actions;
export default dashboardSlice.reducer;
