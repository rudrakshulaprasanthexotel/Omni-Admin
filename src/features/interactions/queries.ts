import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  fetchCampaignDispositions,
  fetchCampaignQaDenominator,
  fetchCampaignQueues,
  fetchCampaignUsers,
  fetchInteractions,
  type InteractionsFilters,
} from './api';

export const interactionKeys = {
  all: ['interactions'] as const,
  lists: () => [...interactionKeys.all, 'list'] as const,
  list: (filters: InteractionsFilters) => [...interactionKeys.lists(), filters] as const,
  queues: (campaignId: number) => [...interactionKeys.all, 'queues', campaignId] as const,
  dispositions: (campaignId: number) =>
    [...interactionKeys.all, 'dispositions', campaignId] as const,
  users: (contactCenterId: number, processId: number, campaignId: number) =>
    [...interactionKeys.all, 'users', contactCenterId, processId, campaignId] as const,
  qaDenominator: (contactCenterId: number, processId: number, campaignId: number) =>
    [...interactionKeys.all, 'qaDenominator', contactCenterId, processId, campaignId] as const,
};

export function useInteractions(filters: InteractionsFilters | null) {
  return useQuery({
    queryKey: interactionKeys.list(filters!),
    queryFn: ({ signal }) => fetchInteractions(filters!, signal),
    enabled: filters !== null,
    placeholderData: keepPreviousData,
    staleTime: 0,
  });
}

export function useCampaignQueues(campaignId: number | null) {
  return useQuery({
    queryKey: interactionKeys.queues(campaignId!),
    queryFn: () => fetchCampaignQueues(campaignId!),
    enabled: campaignId !== null,
  });
}

export function useCampaignDispositions(campaignId: number | null) {
  return useQuery({
    queryKey: interactionKeys.dispositions(campaignId!),
    queryFn: () => fetchCampaignDispositions(campaignId!),
    enabled: campaignId !== null,
  });
}

interface CampaignScope {
  contactCenterId: number | undefined;
  processId: number | undefined;
  campaignId: number | null;
}

const isResolved = (
  scope: CampaignScope,
): scope is { contactCenterId: number; processId: number; campaignId: number } =>
  scope.contactCenterId !== undefined &&
  scope.processId !== undefined &&
  scope.campaignId !== null;

export function useCampaignUsers(scope: CampaignScope) {
  const resolved = isResolved(scope);

  return useQuery({
    queryKey: interactionKeys.users(
      scope.contactCenterId!,
      scope.processId!,
      scope.campaignId!,
    ),
    queryFn: () =>
      fetchCampaignUsers({
        contactCenterId: scope.contactCenterId!,
        processId: scope.processId!,
        campaignId: scope.campaignId!,
      }),
    enabled: resolved,
  });
}

export function useCampaignQaDenominator(scope: CampaignScope) {
  const resolved = isResolved(scope);

  return useQuery({
    queryKey: interactionKeys.qaDenominator(
      scope.contactCenterId!,
      scope.processId!,
      scope.campaignId!,
    ),
    queryFn: () =>
      fetchCampaignQaDenominator({
        contactCenterId: scope.contactCenterId!,
        processId: scope.processId!,
        campaignId: scope.campaignId!,
      }),
    enabled: resolved,
    staleTime: Infinity,
  });
}
