import type { AddCampaignRequestCampaignContextTypeEnum } from '@/boilerplate/cmsApis/models/add-campaign-request';

export interface CreateProcessFormValues {
  processName: string;
  description: string;
  tableDefinitionId: number | '';
}

export interface CreateCampaignFormValues {
  campaignContextName: string;
  description: string;
  campaignContextType: AddCampaignRequestCampaignContextTypeEnum | '';
}
