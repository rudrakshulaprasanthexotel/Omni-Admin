import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, type HoverCardData } from '@exotel-npm-dev/signal-design-system';
import { supervisorApis } from '@/services/apiClient/supervisorApis';
import { loadCached } from '../utils/hoverCardCache';
import { toCustomerHoverInfo } from '../utils/hoverCardPayload';
import { mapCustomerHoverCard } from '../utils/mapCustomerHoverCard';

interface UseCustomerHoverCardArgs {
  name: string;
  customerId?: string;
  campaignId?: number;
}

const loadCustomerInfo = (campaignId: number, customerId: string) =>
  loadCached('customer-info', `${campaignId}:${customerId}`, async () => {
    const response = await supervisorApis.getCustomerInfosForCustomerId(campaignId, customerId);
    return toCustomerHoverInfo(response.data);
  });

export const useCustomerHoverCard = ({
  name,
  customerId,
  campaignId,
}: UseCustomerHoverCardArgs) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [data, setData] = useState<HoverCardData | undefined>();
  const [loadedKey, setLoadedKey] = useState<string>();

  const cacheKey = customerId && campaignId != null ? `${campaignId}:${customerId}` : undefined;

  const channelColors = useMemo(
    () => ({
      call: theme.palette.custom.channelCall,
      whatsapp: theme.palette.custom.channelWhatsApp,
      mail: theme.palette.custom.channelMail,
    }),
    [
      theme.palette.custom.channelCall,
      theme.palette.custom.channelWhatsApp,
      theme.palette.custom.channelMail,
    ],
  );

  const pendingData = useMemo<HoverCardData>(
    () =>
      mapCustomerHoverCard({
        fallbackName: name,
        info: {},
        channelColors,
        t,
      }),
    [channelColors, name, t],
  );

  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open || !cacheKey || !customerId || campaignId == null) return;
      if (loadedKey === cacheKey && data) return;

      setData(pendingData);

      void (async () => {
        try {
          const info = await loadCustomerInfo(campaignId, customerId);
          setData(
            mapCustomerHoverCard({
              fallbackName: name,
              info,
              channelColors,
              t,
            }),
          );
          setLoadedKey(cacheKey);
        } catch {
          setData({
            variant: 'customer',
            title: name,
            footer: t('hoverCardLoadError'),
          });
        }
      })();
    },
    [cacheKey, campaignId, channelColors, customerId, data, loadedKey, name, pendingData, t],
  );

  return {
    enabled: Boolean(cacheKey),
    data: data ?? pendingData,
    onOpenChange,
  };
};
