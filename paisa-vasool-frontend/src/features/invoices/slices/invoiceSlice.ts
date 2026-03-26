import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { invoiceService } from '../services/invoiceService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { InvoiceState, Invoice } from '../types/Invoice';

export const fetchInvoicesThunk = createAsyncThunk<Invoice[], boolean | void>(
  'invoices/fetchAll',
  async (_silent, { rejectWithValue }) => {
    try {
      return await invoiceService.fetchAll();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

const initialState: InvoiceState = {
  invoices: [],
  loading: false,
  refreshing: false,
  error: null,
};

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    clearInvoiceError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoicesThunk.pending, (state, action) => {
        const silent = action.meta.arg as unknown as boolean | undefined;
        if (silent) state.refreshing = true; else state.loading = true;
        state.error = null;
      })
      .addCase(fetchInvoicesThunk.fulfilled, (state, action) => {
        state.loading = false; state.refreshing = false;
        state.invoices = action.payload;
      })
      .addCase(fetchInvoicesThunk.rejected, (state, action) => {
        state.loading = false; state.refreshing = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearInvoiceError } = invoiceSlice.actions;
export default invoiceSlice.reducer;
