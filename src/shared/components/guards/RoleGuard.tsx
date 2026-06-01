import { Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '@/features/auth/authSlice';
import { AccessDeniedPage } from '@/features/auth/pages/AccessDeniedPage';

type UserRole = 'Administrator' | 'supervisor';

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const loginResponse = useAppSelector(selectLoginResponse);
  const userType = loginResponse?.userSessionInfo?.userType?.toLowerCase() ?? '';

  if (!allowedRoles.includes(userType as UserRole)) {
    return <AccessDeniedPage />;
  }

  return <Outlet />;
}
