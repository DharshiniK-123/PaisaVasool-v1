import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { fetchInvoicesThunk, clearInvoiceError } from '../slices/invoiceSlice';

export function useInvoices() {
  const dispatch = useAppDispatch();
  const { invoices, loading, refreshing, error } = useAppSelector(
    (state) => state.invoices
  );

  useEffect(() => {
    dispatch(fetchInvoicesThunk());
  }, [dispatch]);

  const refresh = () => {
    dispatch(fetchInvoicesThunk());
  };

  const clearError = () => {
    dispatch(clearInvoiceError());
  };

  return { invoices, loading, refreshing, error, refresh, clearError };
}
