import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Chip,
  DataGrid,
  Icon,
  Typography,
  useTheme,
  type DataGridProps,
  type DataGridTableHeaderProps,
  type GridColDef,
  type GridRenderCellParams,
  type IconName,
  type MultiSelectOption,
  type ToolbarFilterConfig,
} from '@exotel-npm-dev/signal-design-system';

type ToolbarFilterRecords = Parameters<NonNullable<DataGridProps['onToolbarFiltersChange']>>[0];
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  fetchAssignedCampaigns,
  fetchInteractions,
} from '../asyncActions';
import {
  resetInteractionsPagination,
  selectInteractions,
  selectInteractionsCampaigns,
  selectInteractionsError,
  selectInteractionsLoading,
  selectInteractionsTotalRows,
} from '../interactionsSlice';
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

const CHANNEL_TYPE_ICON: Record<InteractionChannelType, IconName> = {
  [InteractionChannelType.INBOUND]: 'arrow-down-left',
  [InteractionChannelType.OUTBOUND_MANUAL]: 'arrow-up-right',
  [InteractionChannelType.OUTBOUND_MULTI_DIAL]: 'arrow-up-right',
  [InteractionChannelType.OUTBOUND_AUTO_DIAL]: 'arrow-up-right',
};

const PAGE_SIZE_OPTIONS: number[] = [10, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 50;

type PaginationModel = { page: number; pageSize: number };

const initialPaginationModel: PaginationModel = { page: 0, pageSize: DEFAULT_PAGE_SIZE };

const pad = (n: number) => String(n).padStart(2, '0');

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};

const formatShortDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
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

const IconTextCell = ({
  iconName,
  text,
  iconColor,
}: {
  iconName: IconName;
  text: string;
  iconColor?: string;
}) => (
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
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();

  const channelColor: Record<InteractionChannel, string> = {
    [InteractionChannel.CALL]: theme.palette.custom.channelCall,
    [InteractionChannel.WHATSAPP]: theme.palette.custom.channelWhatsApp,
    [InteractionChannel.SMS]: theme.palette.custom.channelSms,
    [InteractionChannel.MAIL]: theme.palette.custom.channelMail,
    [InteractionChannel.CHAT]: theme.palette.custom.channelChat,
  };

  const campaignIdParam = searchParams.get('campaignId');
  const parsedCampaignId = campaignIdParam ? Number(campaignIdParam) : Number.NaN;
  const hasValidCampaignId = Number.isFinite(parsedCampaignId);
  const campaignId = hasValidCampaignId ? parsedCampaignId : null;

  const rows = useAppSelector(selectInteractions);
  const loading = useAppSelector(selectInteractionsLoading);
  const fetchError = useAppSelector(selectInteractionsError);
  const totalRows = useAppSelector(selectInteractionsTotalRows);
  const campaigns = useAppSelector(selectInteractionsCampaigns);

  const [paginationModel, setPaginationModel] =
    useState<PaginationModel>(initialPaginationModel);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText, setDebouncedSearchText] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchText(searchText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchText]);
  const [prevCampaignId, setPrevCampaignId] = useState<number | null>(campaignId);
  if (prevCampaignId !== campaignId) {
    setPrevCampaignId(campaignId);
    setPaginationModel(initialPaginationModel);
    setSearchText('');
    setDebouncedSearchText('');
    dispatch(resetInteractionsPagination());
  }
  const [prevSearchText, setPrevSearchText] = useState(debouncedSearchText);
  if (prevSearchText !== debouncedSearchText) {
    setPrevSearchText(debouncedSearchText);
    setPaginationModel(initialPaginationModel);
    dispatch(resetInteractionsPagination());
  }

  useEffect(() => {
    if (campaigns.length === 0) {
      dispatch(fetchAssignedCampaigns());
    }
  }, [dispatch, campaigns.length]);

  useEffect(() => {
    if (campaigns.length === 0) return;
    if (campaignId !== null) return;
    const firstCampaignId = campaigns[0]?.campaignId;
    if (firstCampaignId === undefined || firstCampaignId === null) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('campaignId', String(firstCampaignId));
        return next;
      },
      { replace: true },
    );
  }, [campaigns, campaignId, setSearchParams]);

  useEffect(() => {
    if (campaignId === null) return;
    dispatch(
      fetchInteractions({
        campaignId,
        pageNumber: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        searchText: debouncedSearchText || undefined,
      }),
    );
  }, [dispatch, campaignId, paginationModel.page, paginationModel.pageSize, debouncedSearchText]);

  const uniqueSorted = (values: string[]): string[] =>
    Array.from(new Set(values.filter(Boolean))).sort();

  const customerOptions = toMultiSelectOptions(
    uniqueSorted(rows.map((r) => r.customer.name)),
  );

  const channelOptions = toMultiSelectOptions(Object.values(InteractionChannel));

  const userOptions = toMultiSelectOptions(uniqueSorted(rows.map((r) => r.user.name)));

  const campaignOptions: MultiSelectOption[] =
    campaigns.length > 0
      ? [...campaigns]
        .sort((a, b) => a.campaignName.localeCompare(b.campaignName))
        .map((c) => ({
          id: String(c.campaignId),
          label: c.campaignName,
          value: String(c.campaignId),
        }))
      : toMultiSelectOptions(uniqueSorted(rows.map((r) => r.campaign)));

  const campaignInitialValue = campaignId !== null ? [String(campaignId)] : undefined;

  const customToolbarFilters: ToolbarFilterConfig[] = [
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
      initialValue: campaignInitialValue,
    },
  ];

  const handleToolbarFiltersChange = (appliedFilters: ToolbarFilterRecords): void => {
    const raw = appliedFilters.campaign;
    const picked = Array.isArray(raw) ? raw[0] : undefined;
    const nextCampaignId = picked && picked.length > 0 ? picked : null;
    const currentCampaignId = searchParams.get('campaignId');
    if (nextCampaignId === currentCampaignId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextCampaignId === null) {
          next.delete('campaignId');
        } else {
          next.set('campaignId', nextCampaignId);
        }
        return next;
      },
      { replace: true },
    );
  };

  const tableHeader: DataGridTableHeaderProps = {
    title: totalRows >= 0
      ? `${t('interactionsPageTitle')} (${totalRows})`
      : t('interactionsPageTitle'),
    showSearch: true,
    searchType: 'basic',
    onBasicSearch: setSearchText,
  };

  const columns: GridColDef<Interaction>[] = [
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
        return (
          <IconTextCell
            iconName={CHANNEL_ICON[channel]}
            text={channel}
            iconColor={channelColor[channel]}
          />
        );
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
        return <IconTextCell iconName={CHANNEL_TYPE_ICON[type]} text={type} />;
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
        params.value ? (
          <IconTextCell iconName="calendar-blank" text={formatShortDate(params.value)} />
        ) : null,
    },
    {
      field: 'interactionTimeSeconds',
      headerName: t('interactionsColumnInteractionTime'),
      width: 211,
      renderCell: (params: GridRenderCellParams<Interaction, number>) => (
        <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
      ),
    },
    {
      field: 'holdTimeSeconds',
      headerName: t('interactionsColumnHoldTime'),
      width: 211,
      renderCell: (params: GridRenderCellParams<Interaction, number>) => (
        <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
      ),
    },
    {
      field: 'ivrTimeSeconds',
      headerName: t('interactionsColumnIvrTime'),
      width: 211,
      renderCell: (params: GridRenderCellParams<Interaction, number>) => (
        <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
      ),
    },
    {
      field: 'setupTimeSeconds',
      headerName: t('interactionsColumnSetupTime'),
      width: 211,
      renderCell: (params: GridRenderCellParams<Interaction, number>) => (
        <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
      ),
    },
    {
      field: 'ringingTimeSeconds',
      headerName: t('interactionsColumnRingingTime'),
      width: 211,
      renderCell: (params: GridRenderCellParams<Interaction, number>) => (
        <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
      ),
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
  ];

  const handleRefresh = () => {
    if (campaignId === null) return;
    dispatch(
      fetchInteractions({
        campaignId,
        pageNumber: paginationModel.page + 1,
        pageSize: paginationModel.pageSize,
        searchText: debouncedSearchText || undefined,
      }),
    );
  };

  const handlePaginationModelChange = (next: PaginationModel) => {
    if (next.pageSize !== paginationModel.pageSize) {
      setPaginationModel({ page: 0, pageSize: next.pageSize });
    } else {
      setPaginationModel(next);
    }
  };

  const emptyStateMessage = campaignId === null
    ? t('interactionsSelectCampaign')
    : fetchError
      ? t('interactionsLoadError')
      : t('interactionsEmptyState');

  return (
    <Box sx={{ flex: 1, height: '100%' }}>
      <DataGrid
        key={campaignId ?? 'no-campaign'}
        rows={rows}
        columns={columns}
        loading={loading}
        tableHeader={tableHeader}
        customToolbarFilters={customToolbarFilters}
        showAppliedFilters
        onRefresh={handleRefresh}
        onToolbarFiltersChange={handleToolbarFiltersChange}
        checkboxSelection
        disableRowSelectionOnClick
        pagination
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        rowCount={totalRows}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        emptyStateMessage={emptyStateMessage}
      />
    </Box>
  );
}

export default Component;
