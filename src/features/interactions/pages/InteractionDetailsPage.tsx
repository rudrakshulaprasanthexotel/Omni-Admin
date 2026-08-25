import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Chip,
  DataGrid,
  Icon,
  Typography,
  type DataGridTableHeaderProps,
  type GridColDef,
  type GridRenderCellParams,
  type GridRowParams,
  type IconName,
  type MultiSelectOption,
  type ToolbarFilterConfig,
} from '@exotel-npm-dev/signal-design-system';
import { mockInteractions } from '../data/mockInteractions';
import {
  InteractionChannel,
  InteractionChannelType,
  type Interaction,
} from '../types';
import IdentityCell from '../components/IdentityCell';

const CHANNEL_ICON: Record<InteractionChannel, IconName> = {
  [InteractionChannel.CALL]: 'phone',
  [InteractionChannel.WHATSAPP]: 'whatsapp-logo',
  [InteractionChannel.SMS]: 'chat-text',
  [InteractionChannel.MAIL]: 'envelope-simple',
  [InteractionChannel.CHAT]: 'chats-circle',
};

const CHANNEL_ICON_COLOR: Record<InteractionChannel, string> = {
  [InteractionChannel.CALL]: '#2E7D32',
  [InteractionChannel.WHATSAPP]: '#25D366',
  [InteractionChannel.SMS]: '#0288D1',
  [InteractionChannel.MAIL]: '#1976D2',
  [InteractionChannel.CHAT]: '#7B1FA2',
};

const CHANNEL_TYPE_ICON: Record<InteractionChannelType, IconName> = {
  [InteractionChannelType.INBOUND]: 'arrow-down-left',
  [InteractionChannelType.OUTBOUND_MANUAL]: 'arrow-up-right',
  [InteractionChannelType.OUTBOUND_MULTI_DIAL]: 'arrow-up-right',
  [InteractionChannelType.OUTBOUND_AUTO_DIAL]: 'arrow-up-right',
};

const PAGE_SIZE_OPTIONS: number[] = [10, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 50;

const pad = (n: number) => String(n).padStart(2, '0');

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const formatShortDate = (iso: string) => {
  const date = new Date(iso);
  const day = date.toLocaleString(undefined, { month: 'short', day: '2-digit' });
  const time = date.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return `${day}, ${time}`;
};

const scoreColor = (score: number, total: number): 'success' | 'warning' | 'error' => {
  const pct = (score / total) * 100;
  if (pct >= 80) return 'success';
  if (pct >= 50) return 'warning';
  return 'error';
};

const iconTextCell = (iconName: IconName, text: string, iconColor?: string) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, height: '100%' }}>
    <Icon name={iconName} size="sm" color={iconColor} />
    <Typography variant="body2" noWrap>
      {text}
    </Typography>
  </Box>
);

const toMultiSelectOptions = (values: string[]): MultiSelectOption[] =>
  values.map((value) => ({ id: value, label: value, value }));

export function Component() {
  const { t } = useTranslation();
  const [rows] = useState<Interaction[]>(mockInteractions);

  const customerOptions = useMemo(
    () =>
      toMultiSelectOptions(
        Array.from(new Set(rows.map((r) => r.customer.name))).sort(),
      ),
    [rows],
  );

  const channelOptions = useMemo(
    () => toMultiSelectOptions(Object.values(InteractionChannel)),
    [],
  );

  const userOptions = useMemo(
    () =>
      toMultiSelectOptions(
        Array.from(new Set(rows.map((r) => r.user.name))).sort(),
      ),
    [rows],
  );

  const campaignOptions = useMemo(
    () =>
      toMultiSelectOptions(
        Array.from(new Set(rows.map((r) => r.campaign))).sort(),
      ),
    [rows],
  );

  const customToolbarFilters: ToolbarFilterConfig[] = useMemo(
    () => [
      {
        id: 'customer',
        type: 'multi-select',
        label: t('interactionsFilterCustomer'),
        multiSelectOptions: customerOptions,
      },
      {
        id: 'channel',
        type: 'multi-select',
        label: t('interactionsFilterChannel'),
        multiSelectOptions: channelOptions,
      },
      {
        id: 'user',
        type: 'multi-select',
        label: t('interactionsFilterUser'),
        multiSelectOptions: userOptions,
      },
      {
        id: 'dateAdded',
        type: 'date-range',
        label: t('interactionsFilterDateRange'),
        iconName: 'calendar-blank',
        allowPastDates: true,
        allowFutureDates: true,
      },
      {
        id: 'campaign',
        type: 'multi-select',
        label: t('interactionsFilterCampaign'),
        multiSelectOptions: campaignOptions,
      },
    ],
    [t, customerOptions, channelOptions, userOptions, campaignOptions],
  );

  const tableHeader: DataGridTableHeaderProps = useMemo(
    () => ({
      title: `${t('interactionsPageTitle')} (${rows.length})`,
      showSearch: true,
      searchType: 'basic',
      actions: [
        {
          id: 'ask-copilot',
          variant: 'outlined',
          color: 'inherit',
          size: 'medium',
          startIconProps: { name: 'sparkle' },
          children: t('interactionsAskCopilot'),
        },
      ],
    }),
    [t, rows.length],
  );

  const columns = useMemo<GridColDef<Interaction>[]>(
    () => [
      {
        field: 'customer',
        headerName: t('interactionsColumnCustomerName'),
        width: 208,
        sortComparator: (a: Interaction['customer'], b: Interaction['customer']) =>
          a.name.localeCompare(b.name),
        renderCell: (params: GridRenderCellParams<Interaction>) => (
          <IdentityCell kind="customer" name={params.row.customer.name} />
        ),
      },
      {
        field: 'channelDetail',
        headerName: t('interactionsColumnChannelDetail'),
        width: 174,
      },
      {
        field: 'channel',
        headerName: t('interactionsColumnChannel'),
        width: 152,
        renderCell: (params: GridRenderCellParams<Interaction, InteractionChannel>) => {
          const channel = params.value;
          if (!channel) return null;
          return iconTextCell(CHANNEL_ICON[channel], channel, CHANNEL_ICON_COLOR[channel]);
        },
      },
      {
        field: 'channelType',
        headerName: t('interactionsColumnChannelType'),
        width: 214,
        renderCell: (
          params: GridRenderCellParams<Interaction, InteractionChannelType>,
        ) => {
          const type = params.value;
          if (!type) return null;
          return iconTextCell(CHANNEL_TYPE_ICON[type], type);
        },
      },
      {
        field: 'user',
        headerName: t('interactionsColumnUser'),
        width: 208,
        sortComparator: (a: Interaction['user'], b: Interaction['user']) =>
          a.name.localeCompare(b.name),
        renderCell: (params: GridRenderCellParams<Interaction>) => (
          <IdentityCell kind="user" name={params.row.user.name} />
        ),
      },
      {
        field: 'scoring',
        headerName: t('interactionsColumnScoring'),
        width: 144,
        sortComparator: (a: Interaction['scoring'], b: Interaction['scoring']) => {
          const av = a ? a.score / a.total : -1;
          const bv = b ? b.score / b.total : -1;
          return av - bv;
        },
        renderCell: (
          params: GridRenderCellParams<Interaction, Interaction['scoring']>,
        ) => {
          const scoring = params.value;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              {scoring ? (
                <Chip
                  label={`${scoring.score}/${scoring.total}`}
                  size="small"
                  variant="tonal"
                  color={scoreColor(scoring.score, scoring.total)}
                />
              ) : (
                <Typography variant="body2" color="text.disabled">
                  —
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        field: 'campaign',
        headerName: t('interactionsColumnCampaign'),
        width: 158,
      },
      {
        field: 'queue',
        headerName: t('interactionsColumnQueue'),
        width: 158,
      },
      {
        field: 'dateAdded',
        headerName: t('interactionsColumnDateAdded'),
        width: 211,
        renderCell: (params: GridRenderCellParams<Interaction, string>) =>
          params.value ? iconTextCell('calendar-blank', formatShortDate(params.value)) : null,
      },
      {
        field: 'interactionTimeSeconds',
        headerName: t('interactionsColumnInteractionTime'),
        width: 211,
        renderCell: (params: GridRenderCellParams<Interaction, number>) =>
          iconTextCell('timer', formatDuration(params.value ?? 0)),
      },
      {
        field: 'holdTimeSeconds',
        headerName: t('interactionsColumnHoldTime'),
        width: 211,
        renderCell: (params: GridRenderCellParams<Interaction, number>) =>
          iconTextCell('timer', formatDuration(params.value ?? 0)),
      },
      {
        field: 'ivrTimeSeconds',
        headerName: t('interactionsColumnIvrTime'),
        width: 211,
        renderCell: (params: GridRenderCellParams<Interaction, number>) =>
          iconTextCell('timer', formatDuration(params.value ?? 0)),
      },
      {
        field: 'setupTimeSeconds',
        headerName: t('interactionsColumnSetupTime'),
        width: 211,
        renderCell: (params: GridRenderCellParams<Interaction, number>) =>
          iconTextCell('timer', formatDuration(params.value ?? 0)),
      },
      {
        field: 'ringingTimeSeconds',
        headerName: t('interactionsColumnRingingTime'),
        width: 211,
        renderCell: (params: GridRenderCellParams<Interaction, number>) =>
          iconTextCell('timer', formatDuration(params.value ?? 0)),
      },
      {
        field: 'systemDisposition',
        headerName: t('interactionsColumnSystemDisposition'),
        width: 230,
      },
      {
        field: 'dispositionClass',
        headerName: t('interactionsColumnDispositionClass'),
        width: 230,
      },
      {
        field: 'dispositionCode',
        headerName: t('interactionsColumnDispositionCode'),
        width: 230,
      },
      {
        field: 'uniqueId',
        headerName: t('interactionsColumnUniqueId'),
        width: 237,
        valueGetter: (_value, row: Interaction) => row.uniqueId ?? row.id,
      },
    ],
    [t],
  );

  const handleRowClick = (_params: GridRowParams<Interaction>) => {
    // Row click routes to the CQA scoring screen (out of scope for this dummy page).
  };

  const handleRefresh = () => {
    // Placeholder — will trigger data refetch when wired up to the API.
  };

  return (
    <Box sx={{ flex: 1, height: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        tableHeader={tableHeader}
        customToolbarFilters={customToolbarFilters}
        showAppliedFilters
        onRefresh={handleRefresh}
        checkboxSelection
        disableRowSelectionOnClick
        onRowClick={handleRowClick}
        initialState={{
          pagination: { paginationModel: { pageSize: DEFAULT_PAGE_SIZE } },
        }}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        pagination
        emptyStateMessage={t('interactionsEmptyState')}
      />
    </Box>
  );
}

export default Component;
