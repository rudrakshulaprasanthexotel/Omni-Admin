import { AcronymApi } from '@/boilerplate/cmsApis/apis/acronym-api';
import { AuthenticationApi } from '@/boilerplate/cmsApis/apis/authentication-api';
import { CampaignApi } from '@/boilerplate/cmsApis/apis/campaign-api';
import { ContactCenterApi } from '@/boilerplate/cmsApis/apis/contact-center-api';
import { DispositionCodeApi } from '@/boilerplate/cmsApis/apis/disposition-code-api';
import { DispositionPlanApi } from '@/boilerplate/cmsApis/apis/disposition-plan-api';
import { ProcessApi } from '@/boilerplate/cmsApis/apis/process-api';
import { QueueApi } from '@/boilerplate/cmsApis/apis/queue-api';
import { ServerPreferenceApi } from '@/boilerplate/cmsApis/apis/server-preference-api';
import { SkillApi } from '@/boilerplate/cmsApis/apis/skill-api';
import { SystemConfigurationApi } from '@/boilerplate/cmsApis/apis/system-configuration-api';
import { UserApi } from '@/boilerplate/cmsApis/apis/user-api';
import { Configuration as CmsConfiguration } from '@/boilerplate/cmsApis/configuration';
import { apiClient } from '.';

export const cmsConfiguration = new CmsConfiguration({});

export const cmsApis = {
	acronym: new AcronymApi(cmsConfiguration, undefined, apiClient),
	authentication: new AuthenticationApi(cmsConfiguration, undefined, apiClient),
	campaign: new CampaignApi(cmsConfiguration, undefined, apiClient),
	contactCenter: new ContactCenterApi(cmsConfiguration, undefined, apiClient),
	process: new ProcessApi(cmsConfiguration, undefined, apiClient),
	queue: new QueueApi(cmsConfiguration, undefined, apiClient),
	user: new UserApi(cmsConfiguration, undefined, apiClient),
	skill: new SkillApi(cmsConfiguration, undefined, apiClient),
	dispositionCode: new DispositionCodeApi(cmsConfiguration, undefined, apiClient),
	dispositionPlan: new DispositionPlanApi(cmsConfiguration, undefined, apiClient),
	serverPreference: new ServerPreferenceApi(cmsConfiguration, undefined, apiClient),
	systemConfiguration: new SystemConfigurationApi(cmsConfiguration, undefined, apiClient),
} as const;
