import { useEffect } from 'react';
import { useAppDispatch } from './hooks/redux';
import { verifyAuthThunk } from './features/auth/slices/authSlice';
import AppRoutes from './app/routes';
import './styles/globals.css';

export default function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(verifyAuthThunk());
  }, [dispatch]);

  return <AppRoutes />;
}