import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  fetchRemindersThunk,
  runAgingJobThunk,
  clearReminderError,
  clearJobSuccess,
  setRefreshing,
} from '../slices/reminderSlice';

export function useReminders() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.reminders);

  useEffect(() => {
    dispatch(fetchRemindersThunk());
  }, [dispatch]);

  const refresh = () => {
    dispatch(setRefreshing(true));
    dispatch(fetchRemindersThunk());
  };

  const runJob = () => {
    dispatch(runAgingJobThunk());
  };

  const clearError = () => dispatch(clearReminderError());
  const dismissJobSuccess = () => dispatch(clearJobSuccess());

  return {
    ...state,
    refresh,
    runJob,
    clearError,
    dismissJobSuccess,
  };
}
