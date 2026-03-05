import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { ROUTES } from '../config/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthLayout from '../layout/AuthLayout';
import AppLayout from '../layout/AppLayout';
import { LoginPage, RegisterPage } from '../features/auth';

const DashboardPage  = lazy(() => import('../features/dashboard/components/DashboardPage'));
const UploadPage     = lazy(() => import('../features/documents/components/UploadPage'));
const MatchingPage   = lazy(() => import('../features/matching/components/MatchingPage'));
const InvoicesPage   = lazy(() => import('../features/invoices/components/InvoiceTable'));
const PaymentsPage   = lazy(() => import('../features/payments/components/PaymentTable'));
const RemindersPage  = lazy(() => import('../features/reminders/components/ReminderPage'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isVerifying } = useAppSelector(s => s.auth as { isAuthenticated: boolean; isVerifying: boolean });
  if (isVerifying) return <LoadingSpinner fullScreen />;
  return isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.LOGIN} replace />;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isVerifying } = useAppSelector(s => s.auth as { isAuthenticated: boolean; isVerifying: boolean });
  if (isVerifying) return <LoadingSpinner fullScreen />;
  return !isAuthenticated ? <>{children}</> : <Navigate to={ROUTES.DASHBOARD} replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.LOGIN} replace />} />
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN}    element={<GuestRoute><LoginPage /></GuestRoute>} />
          <Route path={ROUTES.REGISTER} element={<GuestRoute><RegisterPage /></GuestRoute>} />
        </Route>
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.UPLOAD}    element={<UploadPage />} />
          <Route path={ROUTES.MATCHING}  element={<MatchingPage />} />
          <Route path={ROUTES.INVOICES}  element={<InvoicesPage />} />
          <Route path={ROUTES.PAYMENTS}  element={<PaymentsPage />} />
          <Route path={ROUTES.REMINDERS} element={<RemindersPage />} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
    </Suspense>
  );
}