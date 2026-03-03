import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import {
  fetchMatchesThunk,
  fetchUnmatchedPaymentsThunk,
  fetchUnmatchedInvoicesThunk,
  clearMatchingError,
  setRefreshing,
} from '../slices/matchingSlice';

export function useMatching() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.matching);

  useEffect(() => {
    dispatch(fetchMatchesThunk());
  }, [dispatch]);

  const refresh = () => {
    dispatch(setRefreshing(true));
    dispatch(fetchMatchesThunk());
  };

  const loadUnmatchedPayments = () => {
    dispatch(fetchUnmatchedPaymentsThunk());
  };

  const loadUnmatchedInvoices = () => {
    dispatch(fetchUnmatchedInvoicesThunk());
  };

  const clearError = () => {
    dispatch(clearMatchingError());
  };

  return {
    ...state,
    refresh,
    loadUnmatchedPayments,
    loadUnmatchedInvoices,
    clearError,
  };
}
