import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  PageHeader,
  Tab,
  Tabs,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import { useAppSelector } from '@/store/hooks';
import { selectSelectedProcess } from '../processSlice';

const TAB_KEYS = ['campaigns', 'analytics', 'contactDistribution', 'leads', 'crm', 'settings'] as const;
type ProcessTab = (typeof TAB_KEYS)[number];


const ProcessDetailView = () => {
  const { t } = useTranslation();
  const process = useAppSelector(selectSelectedProcess);
  const [activeTab, setActiveTab] = useState<ProcessTab>('campaigns');

  if (!process) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t('selectProcess')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <PageHeader
          title={process.processName}
          subtitle={process.description}
        />

        <Box sx={{ px: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val as ProcessTab)}
          >
            {TAB_KEYS.map((key) => (
              <Tab key={key} label={t(`processTab_${key}`)} value={key} />
            ))}
          </Tabs>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {t(`processTab_${activeTab}_placeholder`)}
        </Typography>
      </Box>
    </Box>
  );
};

export default ProcessDetailView;
