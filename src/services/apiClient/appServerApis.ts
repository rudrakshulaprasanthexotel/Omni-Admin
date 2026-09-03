import type { AxiosResponse } from 'axios';
import { apiClient } from '.';
import type { TableDefinition } from '@/boilerplate/cmsApis/models';
import type {
  IKeepAliveWithPingPushRequestInputBean,
  ILoginRequestInputBean,
  ILogoutRequestInputBean,
  IRefreshTokenRequestInputBean,
  IRefreshTokenResponse,
  LoginResponse,
} from '@/features/auth/types';

/**
 * Hand-written REST wrapper for the Ameyo appserver surface hosted at
 * `/ameyorestapi/...`. We deliberately use REST here even where the 6x GWT UI
 * still calls GWT-RPC — those RPCs are thin wrappers around these same
 * endpoints (see §5 of the validation report), and the revamp is expected to
 * skip the RPC hop entirely.
 *
 * All routes below are unauthenticated at this layer; the base `apiClient`
 * attaches the `sessionId` header and `Authorization` bearer JWT via its
 * request interceptor.
 */

const APP_SERVER_BASE = import.meta.env.VITE_APP_SERVER_API_BASE_PATH ?? '/ameyorestapi';
const CC_BASE = `${APP_SERVER_BASE}/cc`;

export const APP_SERVER_PATHS = {
  login: `${APP_SERVER_BASE}/userLogin/login`,
  logout: `${APP_SERVER_BASE}/session/userLogout`,
  keepAlive: `${APP_SERVER_BASE}/session/keepAliveWithPingPush`,
  refreshToken: `${APP_SERVER_BASE}/session/refreshToken`,
} as const;

export interface ColumnMapping {
  id?: number;
  columnName?: string;
  columnMappingName?: string;
  columnDisplayName?: string;
  columnType?: string;
  campaignId?: number;
  searchable?: boolean;
  visible?: boolean;
}

export interface AssignedCampaign {
  campaignId: number;
  campaignName: string;
  campaignType?: string;
  processId?: number;
  contactCenterId?: number;
}

export interface AssignedProcess {
  processId: number;
  processName: string;
  processType?: string;
  contactCenterId?: number;
}

export interface UserGroup {
  groupId: number;
  groupName: string;
  campaignId?: number;
}

export interface ContactCenterUser {
  userId: string;
  userName?: string;
  userType?: string;
  systemUserType?: string;
}

export interface AgentQueue {
  agentQueueId: number;
  queueName: string;
  campaignId?: number;
}

export interface DispositionEntry {
  dispositionClassName: string;
  dispositionCodes: Array<{ code: string; name: string }>;
}

/** Flat disposition code from `GET /cc/dispositionCodes/getByCampaign`. */
export interface DispositionCodeBean {
  dispositionCodeId?: number;
  dispositionCodeName?: string;
  dispositionClassId?: number;
}

export interface ContactCenterSettings {
  contactCenterId?: number;
  accountId?: string;
  displayName?: string;
  hostedServerUrl?: string;
  [key: string]: unknown;
}

export interface VoiceCampaignSettings {
  campaignId: number;
  refreshInterval?: number;
  campaignType?: 'inbound' | 'outbound';
  [key: string]: unknown;
}

/**
 * Query-string builder that skips undefined / empty values and expands arrays
 * to repeated `key=v1&key=v2` params, matching the Ameyo REST convention.
 */
function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)));
    } else {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const appServerApis = {
  /**
   * The stale bearer from a previous session would be rejected, so the header
   * is stripped for this one call.
   */
  login(input: ILoginRequestInputBean): Promise<AxiosResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>(APP_SERVER_PATHS.login, input, {
      headers: { Authorization: undefined },
    });
  },

  logout(input: ILogoutRequestInputBean): Promise<AxiosResponse<void>> {
    return apiClient.post<void>(APP_SERVER_PATHS.logout, input);
  },

  keepAliveWithPingPush(
    input: IKeepAliveWithPingPushRequestInputBean,
  ): Promise<AxiosResponse<void>> {
    return apiClient.post<void>(APP_SERVER_PATHS.keepAlive, input);
  },

  refreshToken(
    input: IRefreshTokenRequestInputBean,
  ): Promise<AxiosResponse<IRefreshTokenResponse>> {
    return apiClient.post<IRefreshTokenResponse>(APP_SERVER_PATHS.refreshToken, input);
  },

  /**
   * Column-mapping metadata used by the "Customer …" quick-filter dropdown
   * and the advanced Filters chip. Replaces `RPC CommonGwtRpcService.getColumnMappingsByCampaignId`.
   */
  getColumnMappingsByCampaign(
    campaignId: number,
    info = false,
  ): Promise<AxiosResponse<ColumnMapping[]>> {
    return apiClient.get<ColumnMapping[]>(
      `${CC_BASE}/columnMappings/getByCampaign${buildQuery({ campaignId, info })}`,
    );
  },

  /**
   * List of campaigns assigned to the logged-in supervisor. Replaces
   * `RPC SupervisorGwtRpcService.getAllCampaigns` and drives the Campaign
   * chip + per-row `campaignId → campaignName` join.
   */
  getAssignedCampaigns(sessionId?: string): Promise<AxiosResponse<AssignedCampaign[]>> {
    return apiClient.get<AssignedCampaign[]>(
      `${CC_BASE}/campaigns/getAssigned${buildQuery({ sessionId })}`,
    );
  },

  /**
   * Processes assigned to the logged-in user. Loaded once after login
   * (`GET /ameyorestapi/cc/processes/getAssigned`).
   */
  getAssignedProcesses(sessionId?: string): Promise<AxiosResponse<AssignedProcess[]>> {
    return apiClient.get<AssignedProcess[]>(
      `${CC_BASE}/processes/getAssigned${buildQuery({ sessionId })}`,
    );
  },

  getAllTableDefinitions(): Promise<AxiosResponse<TableDefinition[]>> {
    return apiClient.get<TableDefinition[]>(`${CC_BASE}/tableDefinitions/getAllTableDefinition`);
  },

  /**
   * All groups assigned to a campaign; feeds the Filters chip's User /
   * Group tree.
   */
  getAssignedGroupsInCampaign(campaignId: number): Promise<AxiosResponse<UserGroup[]>> {
    return apiClient.get<UserGroup[]>(
      `${CC_BASE}/usergroup/campaigns/${campaignId}/assignedgroups`,
    );
  },

  /** Tenant-wide list of groups (used when the Filters chip is CC-scoped). */
  getAllAvailableGroups(): Promise<AxiosResponse<UserGroup[]>> {
    return apiClient.get<UserGroup[]>(`${APP_SERVER_BASE}/group/getAllAvailableGroups`);
  },

  /**
   * Contact-center settings — chiefly provides `accountId`, which the CQA
   * client (`cqaApis.getInteractionAnalysis`) needs to compose its URL.
   */
  getContactCenterSettings(): Promise<AxiosResponse<ContactCenterSettings>> {
    return apiClient.get<ContactCenterSettings>(`${CC_BASE}/contactCenterSettings`);
  },

  /**
   * Gates the row Play / Download actions per user privilege.
   */
  isContactCenterPrivilegeAvailableForUserTypesByContext(query: {
    contextType?: string;
    contextId?: string | number;
    privilege?: string;
    userType?: string;
  }): Promise<AxiosResponse<boolean>> {
    return apiClient.get<boolean>(
      `${CC_BASE}/isContactCenterPrivilegeAvailableForUserTypesByContext${buildQuery(query)}`,
    );
  },

  /**
   * Auto-refresh interval driving the "Updated X mins ago" clock for
   * inbound campaigns.
   */
  getInboundVoiceCampaignSettings(
    campaignId: number,
  ): Promise<AxiosResponse<VoiceCampaignSettings>> {
    return apiClient.get<VoiceCampaignSettings>(
      `${APP_SERVER_BASE}/voice/inboundVoiceCampaignSettings/${campaignId}`,
    );
  },

  /** Same as above for outbound campaigns. */
  getOutboundVoiceCampaignSettings(
    campaignId: number,
  ): Promise<AxiosResponse<VoiceCampaignSettings>> {
    return apiClient.get<VoiceCampaignSettings>(
      `${APP_SERVER_BASE}/voice/outboundVoiceCampaignSettings/${campaignId}`,
    );
  },

  /**
   * Flat list of disposition codes on the campaign's disposition plan.
   * `GET /ameyorestapi/cc/dispositionCodes/getByCampaign`.
   */
  getDispositionCodesByCampaign(
    campaignId: number,
    info = false,
  ): Promise<AxiosResponse<DispositionCodeBean[]>> {
    return apiClient.get<DispositionCodeBean[]>(
      `${CC_BASE}/dispositionCodes/getByCampaign${buildQuery({ campaignId, info })}`,
    );
  },

  /**
   * Disposition class + code catalog for a campaign. Used inside the
   * Filters chip to drive the Disposition dropdowns.
   */
  getDispositionClassesWithCodesForCampaign(
    campaignId: number,
  ): Promise<AxiosResponse<DispositionEntry[]>> {
    return apiClient.get<DispositionEntry[]>(
      `${APP_SERVER_BASE}/dispositionManager/getDispositionClassesWithDispositionCodesNameOfCampaign${buildQuery({ campaignId })}`,
    );
  },

  /**
   * Bulk `userId → userName` resolver. Replaces the aggregate RPC
   * `SupervisorGwtRpcService.getAllContactUsersWithGroupInfo` by hitting the
   * underlying REST endpoint directly.
   */
  getAllContactCenterUsers(info?: boolean): Promise<AxiosResponse<ContactCenterUser[]>> {
    return apiClient.get<ContactCenterUser[]>(
      `${CC_BASE}/contactCenterUsers/getAllContactCenterUsers${buildQuery({ info })}`,
    );
  },

  /**
   * Customer attribute values for the hover card.
   * `GET /ameyorestapi/cc/getCustomerInfosForCustomerId?campaignId=&customerId=`.
   */
  getCustomerInfosForCustomerId(
    campaignId: number,
    customerId: string,
  ): Promise<AxiosResponse<unknown>> {
    return apiClient.get(
      `${CC_BASE}/getCustomerInfosForCustomerId${buildQuery({ campaignId, customerId })}`,
    );
  },

  /**
   * Campaigns assigned to a specific user. Channel is derived from `campaignType`.
   * `GET /ameyorestapi/cc/hybrid/campaigns/getAssignedByUserId?userId=`.
   */
  getCampaignsAssignedByUserId(userId: string): Promise<AxiosResponse<AssignedCampaign[]>> {
    return apiClient.get<AssignedCampaign[]>(
      `${CC_BASE}/hybrid/campaigns/getAssignedByUserId${buildQuery({ userId })}`,
    );
  },

  /**
   * Queue picker for the (future) Queue chip. Replaces
   * `RPC SupervisorGwtRpcService.getAllQueues`.
   */
  getAgentQueuesByCampaign(
    campaignId: number,
    info = false,
  ): Promise<AxiosResponse<AgentQueue[]>> {
    return apiClient.get<AgentQueue[]>(
      `${CC_BASE}/agentQueues/getByCampaign${buildQuery({ campaignId, info })}`,
    );
  },
};
