import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Chip,
  DataGrid,
  Icon,
  Typography,
  useTheme,
  type AdvancedSearchPayload,
  type DataGridConsolidatedFilterConfig,
  type DataGridNestedListConfig,
  type DataGridProps,
  type DataGridTableHeaderProps,
  type GridColDef,
  type GridRenderCellParams,
  type IconName,
  type MultiSelectOption,
  type NestedListItem,
  type ToolbarFilterConfig,
} from '@exotel-npm-dev/signal-design-system';

type ToolbarFilterRecords = Parameters<NonNullable<DataGridProps['onToolbarFiltersChange']>>[0];
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { fetchAssignedProcesses } from '@/features/process/asyncActions';
import {
  selectAssignedProcesses,
  selectAssignedProcessesLoaded,
  selectAssignedProcessesLoading,
} from '@/features/process/processSlice';
import {
  fetchAssignedCampaigns,
  fetchInteractions,
  type FetchInteractionsArgs,
} from '../asyncActions';
import {
  resetInteractionsPagination,
  selectInteractions,
  selectInteractionsAfterCursor,
  selectInteractionsBeforeCursor,
  selectInteractionsCampaigns,
  selectInteractionsCampaignsLoading,
  selectInteractionsError,
  selectInteractionsLoading,
  selectInteractionsPageIndex,
  selectInteractionsTotalRows,
  selectInteractionsTotalString,
  setInteractionsPageIndex,
  setInteractionsPageSize,
} from '../interactionsSlice';
import {
  InteractionChannel,
  InteractionChannelType,
  type Interaction,
} from '../types';
import IdentityCell from '../components/IdentityCell';
import { SelectorAvatar, SelectorListItem } from '../components/SelectorEntity';

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

/**
 * Chip-value → wire `channel_type` mapping. The backend expects lowercase
 * `voice` / `whatsapp` / `sms` / `mail` / `chat` on the `channel_type` query
 * param of §4 row #16.
 */
const CHANNEL_TO_WIRE: Record<InteractionChannel, string> = {
  [InteractionChannel.CALL]: 'voice',
  [InteractionChannel.WHATSAPP]: 'whatsapp',
  [InteractionChannel.SMS]: 'sms',
  [InteractionChannel.MAIL]: 'mail',
  [InteractionChannel.CHAT]: 'chat',
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

  const processIdParam = searchParams.get('processId');
  const parsedProcessId = processIdParam ? Number(processIdParam) : Number.NaN;
  const selectedProcessId = Number.isFinite(parsedProcessId) ? parsedProcessId : null;

  const contactCenterId = useAppSelector(selectContactCenterId);
  const rows = useAppSelector(selectInteractions);
  const loading = useAppSelector(selectInteractionsLoading);
  const fetchError = useAppSelector(selectInteractionsError);
  const totalRows = useAppSelector(selectInteractionsTotalRows);
  const totalString = useAppSelector(selectInteractionsTotalString);
  const beforeCursor = useAppSelector(selectInteractionsBeforeCursor);
  const afterCursor = useAppSelector(selectInteractionsAfterCursor);
  const storedPageIndex = useAppSelector(selectInteractionsPageIndex);
  const campaigns = useAppSelector(selectInteractionsCampaigns);
  const campaignsLoading = useAppSelector(selectInteractionsCampaignsLoading);
  const processes = useAppSelector(selectAssignedProcesses);
  const processesLoading = useAppSelector(selectAssignedProcessesLoading);
  const processesLoaded = useAppSelector(selectAssignedProcessesLoaded);

  const activeCampaign = useMemo(
    () => campaigns.find((c) => c.campaignId === campaignId) ?? null,
    [campaigns, campaignId],
  );
  // Falls back to the campaign's processId so a `?campaignId=` deep link still
  // resolves before the assigned-process list lands.
  const processId = selectedProcessId ?? activeCampaign?.processId;
  // The endpoint requires a ccId in the path — prefer the campaign's own
  // (in case the supervisor spans multiple CCs) and fall back to the session's
  // contactCenterId.
  const resolvedCcId = activeCampaign?.contactCenterId ?? contactCenterId;

  const campaignsInProcess = campaigns.filter((c) => c.processId === selectedProcessId);

  // The effects below key off these primitives rather than the arrays above,
  // which are rebuilt every render.
  const isProcessAssigned = processes.some((p) => p.processId === selectedProcessId);
  const firstProcessId = processes[0]?.processId ?? null;
  const isCampaignInProcess = campaignsInProcess.some((c) => c.campaignId === campaignId);
  const firstCampaignIdInProcess = campaignsInProcess[0]?.campaignId ?? null;

  const [paginationModel, setPaginationModel] =
    useState<PaginationModel>(initialPaginationModel);
  const [selectedChannels, setSelectedChannels] = useState<InteractionChannel[]>([]);
  const [committedSearch, setCommittedSearch] = useState<AdvancedSearchPayload | null>(null);
  const searchQuery = committedSearch?.searchValue ?? '';
  const [campaignSearch, setCampaignSearch] = useState('');

  const [prevProcessId, setPrevProcessId] = useState<number | null>(selectedProcessId);
  if (prevProcessId !== selectedProcessId) {
    setPrevProcessId(selectedProcessId);
    setCampaignSearch('');
  }

  const [prevCampaignId, setPrevCampaignId] = useState<number | null>(campaignId);
  if (prevCampaignId !== campaignId) {
    setPrevCampaignId(campaignId);
    setPaginationModel(initialPaginationModel);
    setCommittedSearch(null);
    setSelectedChannels([]);
    dispatch(resetInteractionsPagination());
  }

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    dispatch(resetInteractionsPagination());
  }

  const [prevChannels, setPrevChannels] = useState<InteractionChannel[]>(selectedChannels);
  if (prevChannels.join('|') !== selectedChannels.join('|')) {
    setPrevChannels(selectedChannels);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    dispatch(resetInteractionsPagination());
  }

  useEffect(() => {
    if (campaigns.length === 0) {
      dispatch(fetchAssignedCampaigns());
    }
  }, [dispatch, campaigns.length]);

  // Normally already loaded by `useSessionBootstrap`; this covers a hard reload
  // straight onto /interactions before the bootstrap thunk settles.
  useEffect(() => {
    if (processesLoaded || processesLoading) return;
    dispatch(fetchAssignedProcesses());
  }, [dispatch, processesLoaded, processesLoading]);

  useEffect(() => {
    if (firstProcessId === null) return;
    if (isProcessAssigned) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('processId', String(firstProcessId));
        next.delete('campaignId');
        return next;
      },
      { replace: true },
    );
  }, [firstProcessId, isProcessAssigned, setSearchParams]);

  useEffect(() => {
    if (firstCampaignIdInProcess === null) return;
    if (isCampaignInProcess) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('campaignId', String(firstCampaignIdInProcess));
        return next;
      },
      { replace: true },
    );
  }, [firstCampaignIdInProcess, isCampaignInProcess, setSearchParams]);

  /**
   * Cursor-based paging shim. The DataGrid emits page-index deltas but the
   * endpoint (§4 row #16) only exposes prev/next cursors — so we translate:
   *   next  (page +1) → afterCursor
   *   prev  (page -1) → beforeCursor
   *   reset (page  0) → no cursor
   * Non-adjacent jumps (e.g. page 0 → page 4) are not supported by cursor
   * pagination and get clamped to `afterCursor` (i.e. next page from current).
   */
  const cursorForNextFetch = (
    nextPage: number,
    prevPage: number,
  ): { beforeCursor?: string; afterCursor?: string } => {
    if (nextPage === 0) return {};
    if (nextPage === prevPage + 1 && afterCursor) return { afterCursor };
    if (nextPage === prevPage - 1 && beforeCursor) return { beforeCursor };
    if (nextPage > prevPage && afterCursor) return { afterCursor };
    if (nextPage < prevPage && beforeCursor) return { beforeCursor };
    return {};
  };

  useEffect(() => {
    if (campaignId === null) return;
    if (resolvedCcId === undefined || processId === undefined) return;

    const cursors = cursorForNextFetch(paginationModel.page, storedPageIndex);
    const args: FetchInteractionsArgs = {
      ccId: resolvedCcId,
      processId,
      campaignIds: [campaignId],
      limit: paginationModel.pageSize,
      channelTypes:
        selectedChannels.length > 0
          ? selectedChannels.map((c) => CHANNEL_TO_WIRE[c])
          : undefined,
      customerName: searchQuery || undefined,
      ...cursors,
    };

    dispatch(setInteractionsPageIndex(paginationModel.page));
    dispatch(fetchInteractions(args));
    // The `cursorForNextFetch` closure references `beforeCursor` / `afterCursor`
    // / `storedPageIndex` — but those come from the slice and only change *after*
    // fetch completes, so we intentionally exclude them from the dep list to
    // avoid a fetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dispatch,
    campaignId,
    resolvedCcId,
    processId,
    paginationModel.page,
    paginationModel.pageSize,
    searchQuery,
    selectedChannels,
  ]);

  const uniqueSorted = (values: string[]): string[] =>
    Array.from(new Set(values.filter(Boolean))).sort();

  const customerOptions = toMultiSelectOptions(
    uniqueSorted(rows.map((r) => r.customer.name)),
  );

  const channelOptions = toMultiSelectOptions(Object.values(InteractionChannel));

  const userOptions = toMultiSelectOptions(uniqueSorted(rows.map((r) => r.user.name)));

  const channelInitialValue =
    selectedChannels.length > 0 ? selectedChannels.map((c) => String(c)) : undefined;

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
      initialValue: channelInitialValue,
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
  ];

  const consolidatedFilter: DataGridConsolidatedFilterConfig = {
    label: t('interactionsFiltersLabel'),
    iconName: 'funnel',
    filterSearchPlaceholder: t('interactionsFiltersSearchPlaceholder'),
  };

  // Clearing the campaign is intentional — the effect above then lands on the
  // new process's first campaign.
  const handleProcessSelect = (nextProcessId: number) => {
    if (nextProcessId === selectedProcessId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('processId', String(nextProcessId));
        next.delete('campaignId');
        return next;
      },
      { replace: true },
    );
  };

  const handleCampaignSelect = (nextCampaignId: number) => {
    if (nextCampaignId === campaignId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('campaignId', String(nextCampaignId));
        return next;
      },
      { replace: true },
    );
  };

  const processItems: NestedListItem[] = processes.map((p) => ({
    id: p.processId,
    label: p.processName,
  }));

  // `NestedList` renders the search box but does not filter, so narrow the
  // child list here.
  const campaignQuery = campaignSearch.trim().toLowerCase();
  const campaignItems: NestedListItem[] = campaignsInProcess
    .filter((c) => c.campaignName.toLowerCase().includes(campaignQuery))
    .map((c) => ({ id: c.campaignId, label: c.campaignName }));

  const nestedList: DataGridNestedListConfig = {
    parentList: processItems,
    childList: campaignItems,
    parentListLoading: processesLoading,
    childListLoading: campaignsLoading,
    selectedParentId: selectedProcessId,
    selectedChildIds: campaignId !== null ? [campaignId] : [],
    customParentListRenderer: ({ item }) => (
      <SelectorListItem name={String(item.label)} kind="process" />
    ),
    customChildListRenderer: ({ item }) => (
      <SelectorListItem name={String(item.label)} kind="campaign" />
    ),
    onParentSelect: (item) => handleProcessSelect(Number(item.id)),
    onChildSelect: (item) => handleCampaignSelect(Number(item.id)),
    onChildSearch: setCampaignSearch,
    childSearchValue: campaignSearch,
    childSearchPlaceholder: t('interactionsSelectorCampaignSearchPlaceholder'),
    parentAriaLabel: t('interactionsSelectorProcessAriaLabel'),
    childAriaLabel: t('interactionsSelectorCampaignAriaLabel'),
    parentEmptyText: t('interactionsSelectorProcessEmpty'),
    childEmptyText: t('interactionsSelectorCampaignEmpty'),
    trigger: {
      label: activeCampaign?.campaignName ?? t('interactionsSelectorTriggerPlaceholder'),
      startAdornment: activeCampaign ? (
        <SelectorAvatar name={activeCampaign.campaignName} kind="campaign" size={20} />
      ) : undefined,
    },
  };

  const handleToolbarFiltersChange = (appliedFilters: ToolbarFilterRecords): void => {
    const rawChannel = appliedFilters.channel;
    const pickedChannels = Array.isArray(rawChannel)
      ? (rawChannel.filter((v): v is InteractionChannel =>
          Object.values(InteractionChannel).includes(v as InteractionChannel),
        ) as InteractionChannel[])
      : [];
    setSelectedChannels(pickedChannels);
  };

  // Title badge only renders a count once the backend surfaces a real integer.
  // Delta noted in §4 row #16 (real integer `metadata.total`).
  const titleCount = totalRows >= 0 ? totalRows : totalString ?? null;
  const tableHeader: DataGridTableHeaderProps = {
    title:
      titleCount != null
        ? `${t('interactionsPageTitle')} (${titleCount})`
        : t('interactionsPageTitle'),
    showSearch: true,
    searchType: 'advanced',
    onAdvanceSearch: (payload: AdvancedSearchPayload) => {
      setCommittedSearch(payload.searchValue ? payload : null);
    },
    advancedSearchConfig: {
      options: [
        {
          id: 'customerName',
          label: t('interactionsColumnCustomerName'),
          value: 'customerName',
          placeholder: t('interactionsSearchPlaceholder'),
        },
      ],
      defaultOptionId: 'customerName',
      placeholder: t('interactionsSearchPlaceholder'),
      size: 'medium',
    },
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
    if (campaignId === null || resolvedCcId === undefined || processId === undefined) return;
    dispatch(
      fetchInteractions({
        ccId: resolvedCcId,
        processId,
        campaignIds: [campaignId],
        limit: paginationModel.pageSize,
        channelTypes:
          selectedChannels.length > 0
            ? selectedChannels.map((c) => CHANNEL_TO_WIRE[c])
            : undefined,
        customerName: searchQuery || undefined,
        // Refresh always reloads the current cursor position.
        beforeCursor: beforeCursor ?? undefined,
        afterCursor: afterCursor ?? undefined,
      }),
    );
  };

  const handlePaginationModelChange = (next: PaginationModel) => {
    if (next.pageSize !== paginationModel.pageSize) {
      setPaginationModel({ page: 0, pageSize: next.pageSize });
      dispatch(setInteractionsPageSize(next.pageSize));
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
        consolidatedFilter={consolidatedFilter}
        nestedList={nestedList}
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
