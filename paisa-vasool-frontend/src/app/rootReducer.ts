import { combineReducers } from '@reduxjs/toolkit';
import authReducer from '../features/auth/slices/authSlice';
import documentReducer from '../features/documents/slices/documentSlice';
import invoiceReducer from '../features/invoices/slices/invoiceSlice';
import paymentReducer from '../features/payments/slices/paymentSlice';
import matchingReducer from '../features/matching/slices/matchingSlice';
import reminderReducer from '../features/reminders/slices/reminderSlice';
import dashboardReducer from '../features/dashboard/slices/dashboardSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  documents: documentReducer,
  invoices: invoiceReducer,
  payments: paymentReducer,
  matching: matchingReducer,
  reminders: reminderReducer,
  dashboard: dashboardReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
