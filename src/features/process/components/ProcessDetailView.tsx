import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Icon,
  IconButton,
  Tab,
  Tabs,
  Typography,
} from '@exotel-npm-dev/signal-design-system';
import { useAppSelector } from '@/store/hooks';
import { selectSelectedProcess } from '../processSlice';

const TAB_KEYS = ['campaigns', 'analytics', 'contactDistribution', 'leads', 'crm', 'settings'] as const;
type ProcessTab = (typeof TAB_KEYS)[number];

interface ProcessDetailViewProps {
  panelCollapsed?: boolean;
  onExpandPanel?: () => void;
}

const ProcessDetailView = ({ panelCollapsed, onExpandPanel }: ProcessDetailViewProps) => {
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
        <Box
          sx={{
            overflow: 'hidden',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
          }}
        >
          <Box sx={{ pt: 1.5, pb: 0.5, px: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {panelCollapsed && onExpandPanel && (
                <IconButton size="small" onClick={onExpandPanel}>
                  <Icon name="sidebar" size="sm" />
                </IconButton>
              )}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                <Typography
                  sx={{
                    fontSize: 16,
                    fontWeight: 600,
                    lineHeight: '24px',
                    color: 'text.primary',
                  }}
                >
                  {process.processName}
                </Typography>
                {process.description && (
                  <Typography variant="body2" color="text.secondary">
                    {process.description}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>

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
