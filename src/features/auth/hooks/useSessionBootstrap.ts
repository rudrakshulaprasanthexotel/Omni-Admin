import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectLoginResponse } from "@/features/auth/authSlice";
import { fetchAssignedProcesses } from "@/features/process/asyncActions";
import {
  selectAssignedProcessesLoaded,
  selectAssignedProcessesLoading,
} from "@/features/process/processSlice";

const useSessionBootstrap = () => {
  const dispatch = useAppDispatch();
  const loginResponse = useAppSelector(selectLoginResponse);
  const assignedProcessesLoaded = useAppSelector(selectAssignedProcessesLoaded);
  const assignedProcessesLoading = useAppSelector(selectAssignedProcessesLoading);
  const sessionId = loginResponse?.userSessionInfo?.sessionId;

  useEffect(() => {
    if (!sessionId) return;
    if (assignedProcessesLoaded || assignedProcessesLoading) return;
    dispatch(fetchAssignedProcesses());
  }, [assignedProcessesLoaded, assignedProcessesLoading, dispatch, sessionId]);
};

export default useSessionBootstrap;
