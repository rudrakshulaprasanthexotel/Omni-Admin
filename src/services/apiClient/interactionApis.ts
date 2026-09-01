import type { AxiosResponse } from 'axios';
import { apiClient, getRootState } from '.';

const INTERACTION_SVC_PATH =
  import.meta.env.VITE_INTERACTION_SVC_API_BASE_PATH ?? '/interaction-svc/api';

function interactionServiceOrigin(domain?: string, port?: string): string {
  const host = domain?.trim().replace(/\/+$/, '');
  if (!host) return '';

  const url = new URL(/^https?:\/\//i.test(host) ? host : `https://${host}`);
  const trimmedPort = port?.trim();
  if (trimmedPort && trimmedPort !== '443' && trimmedPort !== '80' && !url.port) {
    url.port = trimmedPort;
  }
  return url.origin;
}

function getInteractionServiceOrigin(): string {
  const loginProperties =
    getRootState()?.auth?.loginResponse?.authenticationState?.authPolicyVsUserInfo?.[
      'auth.type.passwd'
    ]?.loginProperties;

  return interactionServiceOrigin(
    loginProperties?.['interaction.server.domain'],
    loginProperties?.['interaction.server.port'],
  );
}

/** Absolute or relative URL for any interaction-svc path (e.g. `/v1/cc-list/...`). */
function interactionSvcUrl(path: string): string {
  const origin = getInteractionServiceOrigin();
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${origin}${INTERACTION_SVC_PATH}${suffix}`;
}

export const interactionApis = {
  /**
   * Chronological events for a single interaction.
   * `GET {interaction.server.domain}/interaction-svc/api/v1/cc-list/{ccId}/process-list/{processId}/interactions/{id}/interaction-timeline`
   */
  getInteractionTimeline(
    ccId: number,
    processId: number,
    interactionId: string,
  ): Promise<AxiosResponse<unknown>> {
    return apiClient.get(
      interactionSvcUrl(
        `/v1/cc-list/${ccId}/process-list/${processId}/interactions/${encodeURIComponent(interactionId)}/interaction-timeline`,
      ),
    );
  },
};
