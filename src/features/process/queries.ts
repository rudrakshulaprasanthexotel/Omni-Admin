import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  AddCampaignRequest,
  AddProcessRequest,
  Campaign,
  Process,
  TableDefinition,
} from '@/boilerplate/cmsApis/models';
import { apiClient } from '@/services/apiClient';
import { cmsApis } from '@/services/apiClient/cmsApis';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectSelectedProcessId, setSelectedProcessId } from './processSlice';

export const processKeys = {
  all: ['process'] as const,
  processList: (contactCenterId: number) =>
    [...processKeys.all, 'processList', contactCenterId] as const,
  campaignList: (processId: number) => [...processKeys.all, 'campaignList', processId] as const,
  tableDefinitions: () => [...processKeys.all, 'tableDefinitions'] as const,
};

export function useProcessList() {
  const contactCenterId = useAppSelector(selectContactCenterId);

  return useQuery({
    queryKey: processKeys.processList(contactCenterId ?? -1),
    queryFn: async (): Promise<Process[]> => {
      const { data } = await cmsApis.contactCenter.getAllProcessInContactCenter(contactCenterId!);
      return data;
    },
    enabled: contactCenterId != null,
  });
}

export function useSelectedProcess(): Process | null {
  const selectedProcessId = useAppSelector(selectSelectedProcessId);
  const { data: processList } = useProcessList();

  return processList?.find((process) => process.processId === selectedProcessId) ?? null;
}

export function useCampaignList(processId: number) {
  return useQuery({
    queryKey: processKeys.campaignList(processId),
    queryFn: async (): Promise<Campaign[]> => {
      const { data } = await cmsApis.process.getAllCampaignsInProcess(processId);
      return data;
    },
  });
}

export function useTableDefinitions(enabled: boolean) {
  return useQuery({
    queryKey: processKeys.tableDefinitions(),
    queryFn: async (): Promise<TableDefinition[]> => {
      const { data } = await apiClient.get<TableDefinition[]>(
        '/ameyorestapi/cc/tableDefinitions/getAllTableDefinition',
      );
      return data;
    },
    enabled,
  });
}

export function useCreateProcess() {
  const queryClient = useQueryClient();
  const dispatch = useAppDispatch();
  const contactCenterId = useAppSelector(selectContactCenterId);

  return useMutation({
    mutationFn: async (request: AddProcessRequest): Promise<Process> => {
      const { data } = await cmsApis.process.addProcess(request);
      return data;
    },
    onSuccess: (created) => {
      if (created.processId != null) {
        dispatch(setSelectedProcessId(created.processId));
      }
      if (contactCenterId != null) {
        void queryClient.invalidateQueries({
          queryKey: processKeys.processList(contactCenterId),
        });
      }
    },
  });
}

export function useCreateCampaign(processId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: AddCampaignRequest): Promise<Campaign> => {
      const { data } = await cmsApis.campaign.addCampaign(request);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: processKeys.campaignList(processId) });
    },
  });
}
