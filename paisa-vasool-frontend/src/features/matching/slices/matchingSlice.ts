import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { matchingService } from '../services/matchingService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { MatchingState } from '../types/Match';

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchMatchesThunk = createAsyncThunk(
  'matching/fetchMatches',
  async (_, { rejectWithValue }) => {
    try {
      return await matchingService.fetchMatches();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchUnmatchedPaymentsThunk = createAsyncThunk(
  'matching/fetchUnmatchedPayments',
  async (_, { rejectWithValue }) => {
    try {
      return await matchingService.fetchUnmatchedPayments();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const fetchUnmatchedInvoicesThunk = createAsyncThunk(
  'matching/fetchUnmatchedInvoices',
  async (_, { rejectWithValue }) => {
    try {
      return await matchingService.fetchUnmatchedInvoices();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────

const initialState: MatchingState = {
  matches: [],
  unmatchedPayments: [],
  unmatchedInvoices: [],
  loading: false,
  refreshing: false,
  unmatchedPaymentsLoading: false,
  unmatchedInvoicesLoading: false,
  error: null,
};

const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    clearMatchingError(state) {
      state.error = null;
    },
    setRefreshing(state, action) {
      state.refreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchMatches
    builder
      .addCase(fetchMatchesThunk.pending, (state) => {
        if (!state.refreshing) state.loading = true;
        state.error = null;
      })
      .addCase(fetchMatchesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.matches = action.payload;
      })
      .addCase(fetchMatchesThunk.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload as string;
      });

    // fetchUnmatchedPayments
    builder
      .addCase(fetchUnmatchedPaymentsThunk.pending, (state) => {
        state.unmatchedPaymentsLoading = true;
      })
      .addCase(fetchUnmatchedPaymentsThunk.fulfilled, (state, action) => {
        state.unmatchedPaymentsLoading = false;
        state.unmatchedPayments = action.payload;
      })
      .addCase(fetchUnmatchedPaymentsThunk.rejected, (state) => {
        state.unmatchedPaymentsLoading = false;
      });

    // fetchUnmatchedInvoices
    builder
      .addCase(fetchUnmatchedInvoicesThunk.pending, (state) => {
        state.unmatchedInvoicesLoading = true;
      })
      .addCase(fetchUnmatchedInvoicesThunk.fulfilled, (state, action) => {
        state.unmatchedInvoicesLoading = false;
        state.unmatchedInvoices = action.payload;
      })
      .addCase(fetchUnmatchedInvoicesThunk.rejected, (state) => {
        state.unmatchedInvoicesLoading = false;
      });
  },
});

export const { clearMatchingError, setRefreshing } = matchingSlice.actions;
export default matchingSlice.reducer;
