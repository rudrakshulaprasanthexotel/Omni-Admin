import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  DataGrid,
  Icon,
  IconButton,
  Typography,
  type DataGridTableHeaderProps,
  type GridColDef,
  type ToolbarFilterConfig,
} from '@exotel-npm-dev/signal-design-system';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  selectCampaignList,
  selectGetCampaignListLoading,
} from '../processSlice';
import { getCampaignList } from '../asyncActions';
import { CampaignCampaignContextTypeEnum } from '@/boilerplate/cmsApis/models/campaign';
import CampaignEmptyState from './CampaignEmptyState';

interface CampaignDataGridProps {
  processId: number;
  onCreateCampaign: () => void;
}

function getInitials(name?: string): string {
  if (!name) return '';
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const campaignTypeOptions = Object.values(CampaignCampaignContextTypeEnum).map((value) => ({
  value,
  label: value,
}));

const CampaignDataGrid = ({ processId, onCreateCampaign }: CampaignDataGridProps) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const campaigns = useAppSelector(selectCampaignList);
  const loading = useAppSelector(selectGetCampaignListLoading);
  const [viewMode, setViewMode] = useState('list');

  useEffect(() => {
    dispatch(getCampaignList(processId));
  }, [processId, dispatch]);

  const handleRefresh = () => {
    dispatch(getCampaignList(processId));
  };

  const hasCampaigns = campaigns.length > 0;

  if (!loading && !hasCampaigns) {
    return <CampaignEmptyState onCreateCampaign={onCreateCampaign} />;
  }

  const customToolbarFilters: ToolbarFilterConfig[] = [
    {
      id: 'campaignContextType',
      type: 'select',
      label: t('filterType'),
      options: campaignTypeOptions,
    },
    {
      id: 'users',
      type: 'select',
      label: t('filterUsers'),
      options: [],
    },
    {
      id: 'queues',
      type: 'select',
      label: t('filterQueues'),
      options: [],
    },
    {
      id: 'autoAnswer',
      type: 'select',
      label: t('filterAutoAnswer'),
      options: [],
    },
  ];

  const rows = campaigns.map((campaign) => ({
    id: campaign.campaignContextId ?? 0,
    campaignContextName: campaign.campaignContextName ?? '',
    description: campaign.description ?? '',
    campaignContextType: campaign.campaignContextType ?? '',
    campaignContextId: campaign.campaignContextId ?? 0,
  }));

  const columns: GridColDef[] = [
    {
      field: 'campaignContextName',
      headerName: t('campaignColumnName'),
      flex: 1,
      minWidth: 200,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
          <Avatar sx={{ width: 24, height: 24, fontSize: 10 }}>
            {getInitials(params.value)}
          </Avatar>
          <Typography variant="body2" color="primary.main">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'description',
      headerName: t('campaignColumnDescription'),
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'campaignContextType',
      headerName: t('campaignColumnType'),
      flex: 0.7,
      minWidth: 140,
    },
    {
      field: 'campaignContextId',
      headerName: t('campaignColumnId'),
      flex: 0.5,
      minWidth: 80,
    },
    {
      field: 'actions',
      headerName: '',
      width: 60,
      sortable: false,
      disableColumnMenu: true,
      renderCell: () => (
        <IconButton size="small" variant='outlined'>
          <Icon name="dots-three-vertical" />
        </IconButton>
      ),
    },
  ];

  const tableHeader: DataGridTableHeaderProps = {
    title: `${t('processTab_campaigns')} (${campaigns.length.toString().padStart(2, '0')})`,
    showSearch: true,
    searchType: 'basic',
    toggleButtonGroup: {
      options: [
        { value: 'list', iconName: 'list-bullets', ariaLabel: t('listView') },
        { value: 'card', iconName: 'table', ariaLabel: t('cardView') },
      ],
      value: viewMode,
      onChange: setViewMode,
      exclusive: true,
      size: 'small',
    },
    actions: [
      {
        variant: 'contained',
        color: 'primary',
        size: 'medium',
        onClick: onCreateCampaign,
        startIconProps: { name: 'plus' },
        children: t('newCampaign'),
      },
    ],
  };

  return (
    <Box sx={{ flex: 1, height: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        loading={loading}
        customToolbarFilters={customToolbarFilters}
        showAppliedFilters
        onRefresh={handleRefresh}
        tableHeader={tableHeader}
        disableRowSelectionOnClick
        pinnedColumns={{ right: ['actions']}}
        emptyStateMessage={t('noCampaignsFound')}
      />
    </Box>
  );
};

export default CampaignDataGrid;
