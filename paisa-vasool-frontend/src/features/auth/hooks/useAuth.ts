import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { loginThunk, logoutThunk, registerThunk, clearError } from '../slices/authSlice';
import type { LoginPayload, RegisterPayload } from '../types/index';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/constants';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated, isLoading, error } = useAppSelector(
    (state) => state.auth
  );

  const login = async (payload: LoginPayload) => {
    const result = await dispatch(loginThunk(payload));
    if (loginThunk.fulfilled.match(result)) {
      navigate(ROUTES.DASHBOARD);
    }
  };

  const register = async (payload: RegisterPayload) => {
    const result = await dispatch(registerThunk(payload));
    if (registerThunk.fulfilled.match(result)) {
      navigate(ROUTES.LOGIN);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await dispatch(logoutThunk());
    navigate(ROUTES.LOGIN);
  };

  return {
    user,
    accessToken,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    clearError: () => dispatch(clearError()),
  };
};