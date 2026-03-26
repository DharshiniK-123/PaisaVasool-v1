import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { paymentService } from '../services/paymentService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { Payment, PaymentState } from '../types/Payment';

export const fetchPaymentsThunk = createAsyncThunk<Payment[], boolean | void>(
  'payments/fetchAll',
  async (_silent, { rejectWithValue }) => {
    try {
      return await paymentService.fetchAll();
    } catch (err: unknown) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

const initialState: PaymentState = {
  payments: [],
  loading: false,
  refreshing: false,
  error: null,
};

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearPaymentError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentsThunk.pending, (state, action) => {
        const silent = action.meta.arg as boolean | undefined;
        if (silent) {
          state.refreshing = true;
        } else {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchPaymentsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.payments = action.payload;
      })
      .addCase(fetchPaymentsThunk.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearPaymentError } = paymentSlice.actions;
export default paymentSlice.reducer;
