import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { reminderService } from '../services/reminderService';
import { extractErrorMessage } from '../../../utils/errorUtils';
import type { ReminderState } from '../types/Reminder';

export const fetchRemindersThunk = createAsyncThunk(
  'reminders/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await reminderService.fetchAll();
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

export const runAgingJobThunk = createAsyncThunk(
  'reminders/runAgingJob',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await reminderService.runAgingJob();
      dispatch(fetchRemindersThunk());
      return 'Aging job completed successfully. Reminders dispatched.';
    } catch (err) {
      return rejectWithValue(extractErrorMessage(err));
    }
  }
);

const initialState: ReminderState = {
  reminders: [],
  loading: false,
  refreshing: false,
  runningJob: false,
  error: null,
  jobSuccess: null,
};

const reminderSlice = createSlice({
  name: 'reminders',
  initialState,
  reducers: {
    clearReminderError(state) {
      state.error = null;
    },
    clearJobSuccess(state) {
      state.jobSuccess = null;
    },
    setRefreshing(state, action) {
      state.refreshing = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRemindersThunk.pending, (state) => {
        if (!state.refreshing) state.loading = true;
        state.error = null;
      })
      .addCase(fetchRemindersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.reminders = action.payload;
      })
      .addCase(fetchRemindersThunk.rejected, (state, action) => {
        state.loading = false;
        state.refreshing = false;
        state.error = action.payload as string;
      });
    builder
      .addCase(runAgingJobThunk.pending, (state) => {
        state.runningJob = true;
        state.error = null;
        state.jobSuccess = null;
      })
      .addCase(runAgingJobThunk.fulfilled, (state, action) => {
        state.runningJob = false;
        state.jobSuccess = action.payload;
      })
      .addCase(runAgingJobThunk.rejected, (state, action) => {
        state.runningJob = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearReminderError, clearJobSuccess, setRefreshing } = reminderSlice.actions;
export default reminderSlice.reducer;
