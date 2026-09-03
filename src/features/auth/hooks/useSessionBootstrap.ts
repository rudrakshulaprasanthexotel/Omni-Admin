import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectSessionId } from "@/features/auth/authSlice";
import {
  fetchAssignedCampaigns,
  fetchAssignedProcesses,
} from "@/features/process/asyncActions";
import {
  selectAssignedCampaignsLoaded,
  selectAssignedCampaignsLoading,
  selectAssignedProcessesLoaded,
  selectAssignedProcessesLoading,
} from "@/features/process/processSlice";

const useSessionBootstrap = () => {
  const dispatch = useAppDispatch();
  const sessionId = useAppSelector(selectSessionId);
  const assignedProcessesLoaded = useAppSelector(selectAssignedProcessesLoaded);
  const assignedProcessesLoading = useAppSelector(selectAssignedProcessesLoading);
  const assignedCampaignsLoaded = useAppSelector(selectAssignedCampaignsLoaded);
  const assignedCampaignsLoading = useAppSelector(selectAssignedCampaignsLoading);

  useEffect(() => {
    if (!sessionId) return;
    if (assignedProcessesLoaded || assignedProcessesLoading) return;
    dispatch(fetchAssignedProcesses());
  }, [assignedProcessesLoaded, assignedProcessesLoading, dispatch, sessionId]);

  useEffect(() => {
    if (!sessionId) return;
    if (assignedCampaignsLoaded || assignedCampaignsLoading) return;
    dispatch(fetchAssignedCampaigns());
  }, [assignedCampaignsLoaded, assignedCampaignsLoading, dispatch, sessionId]);
};

export default useSessionBootstrap;
