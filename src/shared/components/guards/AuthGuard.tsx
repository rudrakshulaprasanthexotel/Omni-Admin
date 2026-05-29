import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '@/features/auth/authSlice';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const loginResponse = useAppSelector(selectLoginResponse);

  if (!loginResponse) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
