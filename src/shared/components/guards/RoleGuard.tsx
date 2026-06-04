import { Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '@/features/auth/authSlice';
import { AccessDeniedPage } from '@/features/auth/pages/AccessDeniedPage';
import { UserType } from '@/features/auth/types';

interface RoleGuardProps {
  allowedRoles: UserType[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const loginResponse = useAppSelector(selectLoginResponse);
  const userType = loginResponse?.userSessionInfo?.userType ?? '';

  if (!allowedRoles.includes(userType as UserType)) {
    return <AccessDeniedPage />;
  }

  return <Outlet />;
}
