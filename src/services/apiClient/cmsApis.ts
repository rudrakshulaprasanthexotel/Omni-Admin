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
import { axiosInstance } from '.';

export const cmsConfiguration = new CmsConfiguration({});

export const cmsApis = {
	acronym: new AcronymApi(cmsConfiguration, undefined, axiosInstance),
	authentication: new AuthenticationApi(cmsConfiguration, undefined, axiosInstance),
	campaign: new CampaignApi(cmsConfiguration, undefined, axiosInstance),
	contactCenter: new ContactCenterApi(cmsConfiguration, undefined, axiosInstance),
	process: new ProcessApi(cmsConfiguration, undefined, axiosInstance),
	queue: new QueueApi(cmsConfiguration, undefined, axiosInstance),
	user: new UserApi(cmsConfiguration, undefined, axiosInstance),
	skill: new SkillApi(cmsConfiguration, undefined, axiosInstance),
	dispositionCode: new DispositionCodeApi(cmsConfiguration, undefined, axiosInstance),
	dispositionPlan: new DispositionPlanApi(cmsConfiguration, undefined, axiosInstance),
	serverPreference: new ServerPreferenceApi(cmsConfiguration, undefined, axiosInstance),
	systemConfiguration: new SystemConfigurationApi(cmsConfiguration, undefined, axiosInstance),
} as const;
