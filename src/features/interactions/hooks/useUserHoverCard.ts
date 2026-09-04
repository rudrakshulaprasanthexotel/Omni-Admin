import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProfileCardData } from '@exotel-npm-dev/signal-design-system';
import { appServerApis } from '@/services/apiClient/appServerApis';
import { loadCached } from '../utils/hoverCardCache';
import { toAssignedCampaigns, toContactCenterUsers } from '../utils/hoverCardPayload';
import { mapUserHoverCard } from '../utils/mapUserHoverCard';

interface UseUserHoverCardArgs {
  name: string;
  userId?: string;
}

const loadContactCenterUsers = () =>
  loadCached('cc-users', 'all', async () => {
    const response = await appServerApis.getAllContactCenterUsers();
    return toContactCenterUsers(response.data);
  });

const loadAssignedCampaigns = (userId: string) =>
  loadCached('user-campaigns', userId, async () => {
    const response = await appServerApis.getCampaignsAssignedByUserId(userId);
    return toAssignedCampaigns(response.data);
  });

export const useUserHoverCard = ({ name, userId }: UseUserHoverCardArgs) => {
  const { t } = useTranslation();
  const [data, setData] = useState<ProfileCardData | undefined>();
  const [loadedKey, setLoadedKey] = useState<string>();
  const [loading, setLoading] = useState(false);

  const onHoverIntent = useCallback(() => {
    if (!userId) return;
    if (loadedKey === userId && data) return;

    setLoading(true);

    void (async () => {
      try {
        const [users, campaigns] = await Promise.all([
          loadContactCenterUsers(),
          loadAssignedCampaigns(userId),
        ]);
        const user = users.find((entry) => entry.userId === userId);

        setData(
          mapUserHoverCard({
            name: user?.userName ?? name,
            userId: user?.userId ?? userId,
            userType: user?.userType,
            userName: user?.userName,
            systemUserType: user?.systemUserType,
            campaigns: campaigns.map((campaign) => ({
              id: campaign.campaignId,
              name: campaign.campaignName,
            })),
            t,
          }),
        );
        setLoadedKey(userId);
      } catch {
        setData({
          title: name,
          subtitle: userId.startsWith('@') ? userId : `@${userId}`,
          footer: t('hoverCardLoadError'),
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [data, loadedKey, name, t, userId]);

  return {
    enabled: Boolean(userId),
    data,
    loading,
    onHoverIntent,
  };
};
