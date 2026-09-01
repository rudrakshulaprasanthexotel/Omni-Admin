import type { AssignedCampaign, ContactCenterUser } from '@/services/apiClient/supervisorApis';

export function unwrapApiPayload(payload: unknown): unknown {
  let current = payload;
  for (let i = 0; i < 3; i += 1) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) break;
    const record = current as Record<string, unknown>;
    if ('response' in record && record.response != null) {
      current = record.response;
      continue;
    }
    if ('data' in record && record.data != null && typeof record.data === 'object') {
      current = record.data;
      continue;
    }
    break;
  }
  return current;
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function asString(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const text = String(value).trim();
    return text !== '' ? text : undefined;
  }
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export interface CustomerHoverInfo {
  title?: string;
  customerId?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone1?: string;
  phone2?: string;
  createdAtEpoch?: number;
  processId?: string;
  leadId?: string;
}

function fieldValue(
  fields: unknown,
  ...names: string[]
): string | undefined {
  if (!Array.isArray(fields)) return undefined;
  const wanted = new Set(names.map((name) => name.toLowerCase()));
  for (const entry of fields) {
    const record = asRecord(entry);
    const fieldName = asString(record?.fieldName)?.toLowerCase();
    if (!fieldName || !wanted.has(fieldName)) continue;
    const value = asString(record?.value ?? record?.maskedValue);
    if (value) return value;
  }
  return undefined;
}

export function toCustomerHoverInfo(payload: unknown): CustomerHoverInfo {
  const root = asRecord(unwrapApiPayload(payload));
  const customerInfo = asRecord(root?.customerInfo);
  const customerData = asRecord(customerInfo?.customerData);
  const extraData = asRecord(customerInfo?.extraData);
  const customerFields = customerInfo?.customerFields;

  const firstName =
    asString(customerData?.first_name) ?? fieldValue(customerFields, 'first_name');
  const lastName =
    asString(customerData?.last_name) ?? fieldValue(customerFields, 'last_name');
  const combinedName = [firstName, lastName].filter(Boolean).join(' ');
  const title = asString(root?.name) ?? (combinedName !== '' ? combinedName : undefined);

  return {
    title,
    customerId: asString(root?.customerId ?? customerInfo?.customerId ?? customerData?.id),
    firstName,
    lastName,
    email: asString(customerData?.email) ?? fieldValue(customerFields, 'email'),
    phone1:
      asString(customerData?.phone1) ??
      fieldValue(customerFields, 'phone1') ??
      (Array.isArray(root?.phones) ? asString(root.phones[0]) : undefined),
    phone2: asString(customerData?.phone2) ?? fieldValue(customerFields, 'phone2'),
    createdAtEpoch: asNumber(extraData?.created_time_epoch ?? extraData?.created_at),
    processId: asString(customerInfo?.processId),
    leadId: asString(customerInfo?.leadId),
  };
}

export function toContactCenterUsers(payload: unknown): ContactCenterUser[] {
  const unwrapped = unwrapApiPayload(payload);
  if (!Array.isArray(unwrapped)) return [];
  return unwrapped
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry != null)
    .map((entry) => ({
      userId: asString(entry.userId) ?? '',
      userName: asString(entry.userName),
      userType: asString(entry.userType),
      systemUserType: asString(entry.systemUserType),
    }))
    .filter((user) => user.userId !== '');
}

export function toAssignedCampaigns(payload: unknown): AssignedCampaign[] {
  const unwrapped = unwrapApiPayload(payload);
  if (!Array.isArray(unwrapped)) return [];
  return unwrapped
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => entry != null)
    .map((entry) => ({
      campaignId: asNumber(entry.campaignId) ?? 0,
      campaignName: asString(entry.campaignName ?? entry.name) ?? '',
      campaignType: asString(entry.campaignType ?? entry.type),
      processId: asNumber(entry.processId),
      contactCenterId: asNumber(entry.contactCenterId),
    }))
    .filter((campaign) => campaign.campaignId > 0 && campaign.campaignName !== '');
}
