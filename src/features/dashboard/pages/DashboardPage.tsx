import { useAppSelector } from '@/store/hooks';
import { selectLoginResponse } from '@/features/auth/authSlice';
import { Component as AdminDashboard } from './AdminDashboardPage';
import { Component as SupervisorDashboard } from './SupervisorDashboardPage';

export function Component() {
  const loginResponse = useAppSelector(selectLoginResponse);
  const userType = loginResponse?.userSessionInfo?.userType?.toLowerCase() ?? '';

  return userType === 'supervisor' ? <SupervisorDashboard /> : <AdminDashboard />;
}
