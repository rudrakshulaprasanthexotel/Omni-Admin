import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/store/hooks';
import { keepAliveRequest, loginRequest, logoutRequest } from './api';
import { clearLoginResponse, setLoginResponse } from './authSlice';

export function useLogin() {
  const dispatch = useAppDispatch();

  return useMutation({
    mutationFn: loginRequest,
    onSuccess: (loginResponse) => {
      dispatch(setLoginResponse(loginResponse));
    },
  });
}

export function useLogout() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      dispatch(clearLoginResponse());
      queryClient.clear();
    },
  });
}

export function useKeepAlive() {
  return useMutation({ mutationFn: keepAliveRequest });
}
