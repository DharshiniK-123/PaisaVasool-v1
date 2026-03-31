import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { matchingService } from '../services/matchingService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { MatchingState } from '../types/Match';

export const fetchMatchesThunk = createAsyncThunk(
  'matching/fetchMatches',
  async (_, { rejectWithValue }) => {
    try { return await matchingService.fetchMatches(); }
    catch (err) { return rejectWithValue(extractErrorMessage(err)); }
  }
);

export const fetchDiscrepanciesThunk = createAsyncThunk(
  'matching/fetchDiscrepancies',
  async (includeResolved: boolean = false, { rejectWithValue }) => {
    try { return await matchingService.fetchDiscrepancies(includeResolved); }
    catch (err) { return rejectWithValue(extractErrorMessage(err)); }
  }
);

export const fetchUnmatchedPaymentsThunk = createAsyncThunk(
  'matching/fetchUnmatchedPayments',
  async (_, { rejectWithValue }) => {
    try { return await matchingService.fetchUnmatchedPayments(); }
    catch (err) { return rejectWithValue(extractErrorMessage(err)); }
  }
);

export const fetchUnmatchedInvoicesThunk = createAsyncThunk(
  'matching/fetchUnmatchedInvoices',
  async (_, { rejectWithValue }) => {
    try { return await matchingService.fetchUnmatchedInvoices(); }
    catch (err) { return rejectWithValue(extractErrorMessage(err)); }
  }
);

export const fetchPendingReviewThunk = createAsyncThunk(
  'matching/fetchPendingReview',
  async (_, { rejectWithValue }) => {
    try { return await matchingService.fetchPendingReview(); }
    catch (err) { return rejectWithValue(extractErrorMessage(err)); }
  }
);

export const approveMatchThunk = createAsyncThunk(
  'matching/approveMatch',
  async ({ paymentId, matchId }: { paymentId: number; matchId: number }, { rejectWithValue }) => {
    try { return await matchingService.approveMatch(paymentId, matchId); }
    catch (err) { return rejectWithValue(extractErrorMessage(err)); }
  }
);

export const rejectMatchThunk = createAsyncThunk(
  'matching/rejectMatch',
  async ({ paymentId, matchId }: { paymentId: number; matchId: number }, { rejectWithValue }) => {
    try { return await matchingService.rejectMatch(paymentId, matchId); }
    catch (err) { return rejectWithValue(extractErrorMessage(err)); }
  }
);

export const manualAssignThunk = createAsyncThunk(
  'matching/manualAssign',
  async ({ paymentId, invoiceId }: { paymentId: number; invoiceId: number }, { rejectWithValue }) => {
    try { return await matchingService.manualAssign(paymentId, invoiceId); }
    catch (err) { return rejectWithValue(extractErrorMessage(err)); }
  }
);

const initialState: MatchingState = {
  matches: [],
  discrepancies: [],
  unmatchedPayments: [],
  unmatchedInvoices: [],
  pendingReview: [],
  loading: false,
  refreshing: false,
  discrepanciesLoading: false,
  unmatchedPaymentsLoading: false,
  unmatchedInvoicesLoading: false,
  pendingReviewLoading: false,
  error: null,
};

const matchingSlice = createSlice({
  name: 'matching',
  initialState,
  reducers: {
    clearMatchingError(state) { state.error = null; },
    setRefreshing(state, action) { state.refreshing = action.payload; },
    // Remove a suggested match from local state after approve/reject
    removePendingReview(state, action: { payload: number }) {
      state.pendingReview = state.pendingReview.filter(m => m.match_id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMatchesThunk.pending,   (state) => { if (!state.refreshing) state.loading = true; state.error = null; })
      .addCase(fetchMatchesThunk.fulfilled, (state, action) => { state.loading = false; state.refreshing = false; state.matches = action.payload; })
      .addCase(fetchMatchesThunk.rejected,  (state, action) => { state.loading = false; state.refreshing = false; state.error = action.payload as string; });

    builder
      .addCase(fetchDiscrepanciesThunk.pending,   (state) => { state.discrepanciesLoading = true; })
      .addCase(fetchDiscrepanciesThunk.fulfilled, (state, action) => { state.discrepanciesLoading = false; state.discrepancies = action.payload; })
      .addCase(fetchDiscrepanciesThunk.rejected,  (state) => { state.discrepanciesLoading = false; });

    builder
      .addCase(fetchUnmatchedPaymentsThunk.pending,   (state) => { state.unmatchedPaymentsLoading = true; })
      .addCase(fetchUnmatchedPaymentsThunk.fulfilled, (state, action) => { state.unmatchedPaymentsLoading = false; state.unmatchedPayments = action.payload; })
      .addCase(fetchUnmatchedPaymentsThunk.rejected,  (state) => { state.unmatchedPaymentsLoading = false; });

    builder
      .addCase(fetchUnmatchedInvoicesThunk.pending,   (state) => { state.unmatchedInvoicesLoading = true; })
      .addCase(fetchUnmatchedInvoicesThunk.fulfilled, (state, action) => { state.unmatchedInvoicesLoading = false; state.unmatchedInvoices = action.payload; })
      .addCase(fetchUnmatchedInvoicesThunk.rejected,  (state) => { state.unmatchedInvoicesLoading = false; });

    builder
      .addCase(fetchPendingReviewThunk.pending,   (state) => { state.pendingReviewLoading = true; })
      .addCase(fetchPendingReviewThunk.fulfilled, (state, action) => { state.pendingReviewLoading = false; state.pendingReview = action.payload; })
      .addCase(fetchPendingReviewThunk.rejected,  (state) => { state.pendingReviewLoading = false; });

    // After approve/reject/assign — remove from pending list, refresh matches
    builder
      .addCase(approveMatchThunk.fulfilled, (state, action) => {
        state.pendingReview = state.pendingReview.filter(m => m.match_id !== (action.meta.arg as any).matchId);
      })
      .addCase(rejectMatchThunk.fulfilled, (state, action) => {
        state.pendingReview = state.pendingReview.filter(m => m.match_id !== (action.meta.arg as any).matchId);
      });
  },
});

export const { clearMatchingError, setRefreshing, removePendingReview } = matchingSlice.actions;
export default matchingSlice.reducer;
