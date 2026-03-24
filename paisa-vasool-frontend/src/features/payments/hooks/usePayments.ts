import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { fetchPaymentsThunk, clearPaymentError } from '../slices/paymentSlice';

export function usePayments() {
  const dispatch = useAppDispatch();
  const { payments, loading, refreshing, error } = useAppSelector(
    (state) => state.payments
  );

  useEffect(() => {
    dispatch(fetchPaymentsThunk());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchPaymentsThunk(true as any));
  };

  const clearError = () => {
    dispatch(clearPaymentError());
  };

  return { payments, loading, refreshing, error, refresh, clearError };
}
