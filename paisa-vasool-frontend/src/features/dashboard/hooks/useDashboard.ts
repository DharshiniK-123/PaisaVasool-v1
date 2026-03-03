import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  fetchDashboardSummaryThunk,
  fetchRecentMatchesThunk,
  fetchDashboardStatsThunk,
  clearDashboardError,
} from '../slices/dashboardSlice';

export function useDashboard() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardSummaryThunk());
    dispatch(fetchRecentMatchesThunk());
    dispatch(fetchDashboardStatsThunk());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchDashboardSummaryThunk());
    dispatch(fetchRecentMatchesThunk());
    dispatch(fetchDashboardStatsThunk());
  };

  const clearError = () => dispatch(clearDashboardError());

  return { ...state, refresh, clearError };
}
