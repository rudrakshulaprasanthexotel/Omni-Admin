import type { TFunction } from 'i18next';
import type { ProfileCardData, ProfileCardDetail } from '@exotel-npm-dev/signal-design-system';
import { displayValue } from './formatInteraction';

interface MapUserHoverCardArgs {
  name: string;
  userId?: string;
  userType?: string;
  userName?: string;
  systemUserType?: string;
  campaigns: Array<{ id: number; name: string }>;
  t: TFunction;
}

export function mapUserHoverCard({
  name,
  userId,
  userType,
  userName,
  systemUserType,
  campaigns,
  t,
}: MapUserHoverCardArgs): ProfileCardData {
  const details: ProfileCardDetail[] = [
    { id: 'userType', label: t('hoverCardUserType'), value: displayValue(userType) },
    {
      id: 'systemUserType',
      label: t('hoverCardSystemUserType'),
      value: displayValue(systemUserType),
    },
  ];

  return {
    title: userName ?? name,
    subtitle: userId ? (userId.startsWith('@') ? userId : `@${userId}`) : undefined,
    details,
    sections:
      campaigns.length > 0
        ? [
            {
              id: 'campaigns',
              title: t('hoverCardCampaigns', { count: campaigns.length }),
              items: campaigns.map((campaign) => ({
                id: String(campaign.id),
                label: campaign.name,
              })),
            },
          ]
        : undefined,
  };
}
