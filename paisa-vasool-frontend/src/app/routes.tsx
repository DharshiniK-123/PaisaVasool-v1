import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import { ROUTES } from '../config/constants';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AuthLayout from '../layout/AuthLayout';
import AppLayout from '../layout/AppLayout';
import AdminLayout from '../layout/AdminLayout';
import { LoginPage, RegisterPage } from '../features/auth';
import AdminInvoicesPage from '../features/invoices/components/AdminInvoicesPage';
import AdminPaymentsPage from '../features/payments/components/AdminPaymentsPage';
import AdminRemindersPage from '../features/reminders/components/AdminRemindersPage';

const DashboardPage       = lazy(() => import('../features/dashboard/components/DashboardPage'));
const MatchingPage        = lazy(() => import('../features/matching/components/MatchingPage'));
const InvoicesPage        = lazy(() => import('../features/invoices/components/InvoiceTable'));
const PaymentsPage        = lazy(() => import('../features/payments/components/PaymentTable'));
const RemindersPage       = lazy(() => import('../features/reminders/components/ReminderPage'));
const UserManagementPage  = lazy(() => import('../features/UserManagement/components/UserManagementPage'));
const AdminDashboardPage  = lazy(() => import('../features/dashboard/components/AdminDashboardPage'));

function useAuthState() {
  return useAppSelector(s => s.auth as {
    isAuthenticated: boolean;
    isVerifying: boolean;
    user: { role?: string } | null;
  });
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isVerifying, user } = useAuthState();
  if (isVerifying) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user?.role !== 'admin') return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <>{children}</>;
}

function FinanceRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isVerifying, user } = useAuthState();
  if (isVerifying) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;
  if (user?.role === 'admin') return <Navigate to={ROUTES.ADMIN_DASHBOARD} replace />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isVerifying, user } = useAuthState();
  if (isVerifying) return <LoadingSpinner fullScreen />;
  if (!isAuthenticated) return <>{children}</>;
  return <Navigate to={user?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : ROUTES.DASHBOARD} replace />;
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
        <Route element={<FinanceRoute><AppLayout /></FinanceRoute>}>
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          <Route path={ROUTES.MATCHING}  element={<MatchingPage />} />
          <Route path={ROUTES.INVOICES}  element={<InvoicesPage />} />
          <Route path={ROUTES.PAYMENTS}  element={<PaymentsPage />} />
          <Route path={ROUTES.REMINDERS} element={<RemindersPage />} />
        </Route>
        <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminDashboardPage />} />
          <Route path={ROUTES.ADMIN_USERS}     element={<UserManagementPage />} />
          <Route path={ROUTES.ADMIN_INVOICES}  element={<AdminInvoicesPage />} />
          <Route path={ROUTES.ADMIN_PAYMENTS}  element={<AdminPaymentsPage />} />
          <Route path={ROUTES.ADMIN_REMINDERS} element={<AdminRemindersPage />} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.LOGIN} replace />} />
      </Routes>
      
    </Suspense>
  );
}