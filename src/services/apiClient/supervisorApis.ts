import type { AxiosResponse } from 'axios';
import { apiClient } from '.';

/**
 * Hand-written REST wrapper for the "supervisor" surface hosted at
 * `/ameyorestapi/...` on the Ameyo appserver. We deliberately use REST here
 * even where the 6x GWT UI still calls GWT-RPC — those RPCs are thin wrappers
 * around these same endpoints (see §5 of the validation report), and the
 * revamp is expected to skip the RPC hop entirely.
 *
 * All routes below are unauthenticated at this layer; the base `apiClient`
 * attaches the `sessionId` header and `Authorization` bearer JWT via its
 * request interceptor.
 */

const AMEYO_REST_BASE = '/ameyorestapi';
const CC_REST_BASE = `${AMEYO_REST_BASE}/cc`;

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

export interface CampaignUser {
  userId: string;
  userName: string;
  groupIds?: number[];
}

export interface CampaignUserPage {
  users: CampaignUser[];
  totalCount: number;
  pageNumber?: number;
  pageSize?: number;
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

export const supervisorApis = {
  /**
   * Column-mapping metadata used by the "Customer …" quick-filter dropdown
   * and the advanced Filters chip. Replaces `RPC CommonGwtRpcService.getColumnMappingsByCampaignId`.
   */
  getColumnMappingsByCampaign(
    campaignId: number,
    info = false,
  ): Promise<AxiosResponse<ColumnMapping[]>> {
    return apiClient.get<ColumnMapping[]>(
      `${CC_REST_BASE}/columnMappings/getByCampaign${buildQuery({ campaignId, info })}`,
    );
  },

  /**
   * List of campaigns assigned to the logged-in supervisor. Replaces
   * `RPC SupervisorGwtRpcService.getAllCampaigns` and drives the Campaign
   * chip + per-row `campaignId → campaignName` join.
   */
  getAssignedCampaigns(sessionId?: string): Promise<AxiosResponse<AssignedCampaign[]>> {
    return apiClient.get<AssignedCampaign[]>(
      `${CC_REST_BASE}/campaigns/getAssigned${buildQuery({ sessionId })}`,
    );
  },

  /**
   * Processes assigned to the logged-in user. Loaded once after login
   * (`GET /ameyorestapi/cc/processes/getAssigned`).
   */
  getAssignedProcesses(sessionId?: string): Promise<AxiosResponse<AssignedProcess[]>> {
    return apiClient.get<AssignedProcess[]>(
      `${CC_REST_BASE}/processes/getAssigned${buildQuery({ sessionId })}`,
    );
  },

  /**
   * All groups assigned to a campaign; feeds the Filters chip's User /
   * Group tree.
   */
  getAssignedGroupsInCampaign(campaignId: number): Promise<AxiosResponse<UserGroup[]>> {
    return apiClient.get<UserGroup[]>(
      `${CC_REST_BASE}/usergroup/campaigns/${campaignId}/assignedgroups`,
    );
  },

  /** Tenant-wide list of groups (used when the Filters chip is CC-scoped). */
  getAllAvailableGroups(): Promise<AxiosResponse<UserGroup[]>> {
    return apiClient.get<UserGroup[]>(`${AMEYO_REST_BASE}/group/getAllAvailableGroups`);
  },

  /**
   * Contact-center settings — chiefly provides `accountId`, which the CQA
   * client (`cqaApis.getInteractionAnalysis`) needs to compose its URL.
   */
  getContactCenterSettings(): Promise<AxiosResponse<ContactCenterSettings>> {
    return apiClient.get<ContactCenterSettings>(`${CC_REST_BASE}/contactCenterSettings`);
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
      `${CC_REST_BASE}/isContactCenterPrivilegeAvailableForUserTypesByContext${buildQuery(query)}`,
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
      `${AMEYO_REST_BASE}/voice/inboundVoiceCampaignSettings/${campaignId}`,
    );
  },

  /** Same as above for outbound campaigns. */
  getOutboundVoiceCampaignSettings(
    campaignId: number,
  ): Promise<AxiosResponse<VoiceCampaignSettings>> {
    return apiClient.get<VoiceCampaignSettings>(
      `${AMEYO_REST_BASE}/voice/outboundVoiceCampaignSettings/${campaignId}`,
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
      `${CC_REST_BASE}/dispositionCodes/getByCampaign${buildQuery({ campaignId, info })}`,
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
      `${AMEYO_REST_BASE}/dispositionManager/getDispositionClassesWithDispositionCodesNameOfCampaign${buildQuery({ campaignId })}`,
    );
  },

  /**
   * Paginated user picker for the User chip.
   */
  getCampaignUsers(args: {
    contactCenterId: number;
    processId: number;
    campaignId: number;
    pageNumber?: number;
    pageSize?: number;
    search?: string;
  }): Promise<AxiosResponse<CampaignUserPage>> {
    const { contactCenterId, processId, campaignId, ...query } = args;
    return apiClient.get<CampaignUserPage>(
      `/cms/cc/${contactCenterId}/process/${processId}/campaign/${campaignId}/campaign-user${buildQuery(query)}`,
    );
  },

  /**
   * Bulk `userId → userName` resolver. Replaces the aggregate RPC
   * `SupervisorGwtRpcService.getAllContactUsersWithGroupInfo` by hitting the
   * underlying REST endpoint directly.
   */
  getAllContactCenterUsers(info?: boolean): Promise<AxiosResponse<ContactCenterUser[]>> {
    return apiClient.get<ContactCenterUser[]>(
      `${CC_REST_BASE}/contactCenterUsers/getAllContactCenterUsers${buildQuery({ info })}`,
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
      `${CC_REST_BASE}/getCustomerInfosForCustomerId${buildQuery({ campaignId, customerId })}`,
    );
  },

  /**
   * Campaigns assigned to a specific user. Channel is derived from `campaignType`.
   * `GET /ameyorestapi/cc/hybrid/campaigns/getAssignedByUserId?userId=`.
   */
  getCampaignsAssignedByUserId(userId: string): Promise<AxiosResponse<AssignedCampaign[]>> {
    return apiClient.get<AssignedCampaign[]>(
      `${CC_REST_BASE}/hybrid/campaigns/getAssignedByUserId${buildQuery({ userId })}`,
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
      `${CC_REST_BASE}/agentQueues/getByCampaign${buildQuery({ campaignId, info })}`,
    );
  },
};
