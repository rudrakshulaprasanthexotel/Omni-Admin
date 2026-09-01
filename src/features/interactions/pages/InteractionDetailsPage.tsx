import { useEffect, useMemo, useRef, useState } from 'react';
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
import { debounce } from '@/shared/utils/debounce';
import type { QueueDetailBean } from '@/boilerplate/cmsApis/models';
import type { DispositionCodeBean } from '@/services/apiClient/supervisorApis';
import { selectContactCenterId } from '@/features/auth/authSlice';
import { fetchAssignedProcesses } from '@/features/process/asyncActions';
import {
  selectAssignedProcesses,
  selectAssignedProcessesLoaded,
  selectAssignedProcessesLoading,
} from '@/features/process/processSlice';
import {
  fetchAssignedCampaigns,
  fetchCampaignDispositions,
  fetchCampaignQueues,
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
import InteractionRowActions from '../components/InteractionRowActions';
import { SelectorAvatar, SelectorListItem } from '../components/SelectorEntity';
import { CHANNEL_ICON, CHANNEL_TYPE_ICON } from '../constants';
import { formatDuration, formatShortDate } from '../utils/formatInteraction';

/**
 * Channel filter chips → `channel_type` query param. The interactions
 * endpoint accepts `VOICE` / `CHAT` (same allowed values as other Data Engine
 * channel-type filters).
 */
const CHANNEL_TYPE_FILTER = ['VOICE', 'CHAT'] as const;
type ChannelTypeFilter = (typeof CHANNEL_TYPE_FILTER)[number];

const toChannelTypesParam = (
  channels: ChannelTypeFilter[],
): ChannelTypeFilter[] | undefined => (channels.length > 0 ? channels : undefined);

type SortModel = NonNullable<DataGridProps['sortModel']>;

/**
 * Grid column → `sort_by` wire column. The endpoint sorts on the snake_case
 * bean fields, so only columns backed by a top-level field can be sorted;
 * everything else is marked `sortable: false` on its column definition.
 */
const SORT_FIELD_TO_WIRE: Record<string, string> = {
  customer: 'customer_name',
  channel: 'channel_name',
  channelType: 'direction',
  user: 'last_assigned_user_name',
  campaign: 'last_campaign_name',
  queue: 'last_queue_name',
  dateAdded: 'date_added',
  dispositionCode: 'last_disposition',
  uniqueId: 'interaction_relation_id',
};

const DEFAULT_SORT_MODEL: SortModel = [{ field: 'dateAdded', sort: 'desc' }];

/** Builds `sort_by=<column>:<asc|desc>,…`; `undefined` lets the thunk default apply. */
const toSortBy = (model: SortModel): string | undefined => {
  const parts = model
    .map(({ field, sort }) => {
      const column = SORT_FIELD_TO_WIRE[field];
      return column ? `${column}:${sort ?? 'asc'}` : null;
    })
    .filter((part): part is string => part != null);
  return parts.length > 0 ? parts.join(',') : undefined;
};

const PAGE_SIZE_OPTIONS: number[] = [10, 50, 100, 200];
const DEFAULT_PAGE_SIZE = 50;

type PaginationModel = { page: number; pageSize: number };

const initialPaginationModel: PaginationModel = { page: 0, pageSize: DEFAULT_PAGE_SIZE };

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

const toQueueOptions = (queues: QueueDetailBean[]): MultiSelectOption[] =>
  queues
    .filter((queue): queue is QueueDetailBean & { queueId: number } =>
      typeof queue.queueId === 'number',
    )
    .map((queue) => {
      const id = String(queue.queueId);
      return {
        id,
        value: id,
        label: queue.queueName?.trim() || id,
      };
    });

const toDispositionOptions = (codes: DispositionCodeBean[]): MultiSelectOption[] =>
  codes
    .map((code) => {
      const name = code.dispositionCodeName?.trim();
      if (!name) return null;
      const id =
        code.dispositionCodeId != null ? String(code.dispositionCodeId) : name;
      return { id, value: name, label: name };
    })
    .filter((option): option is MultiSelectOption => option != null);

export function Component() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const theme = useTheme();

  const channelColor: Record<InteractionChannel, string> = useMemo(
    () => ({
      [InteractionChannel.CALL]: theme.palette.custom.channelCall,
      [InteractionChannel.WHATSAPP]: theme.palette.custom.channelWhatsApp,
      [InteractionChannel.SMS]: theme.palette.custom.channelSms,
      [InteractionChannel.MAIL]: theme.palette.custom.channelMail,
      [InteractionChannel.CHAT]: theme.palette.custom.channelChat,
    }),
    [
      theme.palette.custom.channelCall,
      theme.palette.custom.channelWhatsApp,
      theme.palette.custom.channelSms,
      theme.palette.custom.channelMail,
      theme.palette.custom.channelChat,
    ],
  );

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
  const [sortModel, setSortModel] = useState<SortModel>(DEFAULT_SORT_MODEL);
  const sortBy = toSortBy(sortModel);
  const [selectedChannels, setSelectedChannels] = useState<ChannelTypeFilter[]>([]);
  const [queues, setQueues] = useState<QueueDetailBean[]>([]);
  const [selectedQueueIds, setSelectedQueueIds] = useState<number[]>([]);
  const [dispositions, setDispositions] = useState<DispositionCodeBean[]>([]);
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const commitSearch = useRef(
    debounce((value: string) => {
      setSearchQuery(value);
    }),
  ).current;
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
    setSearchInput('');
    setSearchQuery('');
    commitSearch.cancel();
    setSelectedChannels([]);
    setSelectedQueueIds([]);
    setQueues([]);
    setSelectedDispositions([]);
    setDispositions([]);
    dispatch(resetInteractionsPagination());
  }

  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    dispatch(resetInteractionsPagination());
  }

  const [prevChannels, setPrevChannels] = useState<ChannelTypeFilter[]>(selectedChannels);
  if (prevChannels.join('|') !== selectedChannels.join('|')) {
    setPrevChannels(selectedChannels);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    dispatch(resetInteractionsPagination());
  }

  const [prevQueueIds, setPrevQueueIds] = useState<number[]>(selectedQueueIds);
  if (prevQueueIds.join('|') !== selectedQueueIds.join('|')) {
    setPrevQueueIds(selectedQueueIds);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    dispatch(resetInteractionsPagination());
  }

  const [prevDispositions, setPrevDispositions] = useState<string[]>(selectedDispositions);
  if (prevDispositions.join('|') !== selectedDispositions.join('|')) {
    setPrevDispositions(selectedDispositions);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    dispatch(resetInteractionsPagination());
  }

  // Cursors are tied to the previous ordering, so a new sort restarts paging.
  const [prevSortBy, setPrevSortBy] = useState(sortBy);
  if (prevSortBy !== sortBy) {
    setPrevSortBy(sortBy);
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
    dispatch(resetInteractionsPagination());
  }

  useEffect(() => {
    return () => commitSearch.cancel();
  }, [commitSearch]);

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

  useEffect(() => {
    if (campaignId === null) return;

    let cancelled = false;
    void (async () => {
      try {
        const result = await dispatch(fetchCampaignQueues(campaignId)).unwrap();
        if (!cancelled) setQueues(result.response?.data ?? []);
      } catch {
        if (!cancelled) setQueues([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, campaignId]);

  useEffect(() => {
    if (campaignId === null) return;

    let cancelled = false;
    void (async () => {
      try {
        const result = await dispatch(fetchCampaignDispositions(campaignId)).unwrap();
        if (!cancelled) setDispositions(result.response?.data ?? []);
      } catch {
        if (!cancelled) setDispositions([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, campaignId]);

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
      channelTypes: toChannelTypesParam(selectedChannels),
      queueIds: selectedQueueIds.length > 0 ? selectedQueueIds : undefined,
      dispositions: selectedDispositions.length > 0 ? selectedDispositions : undefined,
      customerName: searchQuery || undefined,
      sortBy,
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
    selectedQueueIds,
    selectedDispositions,
    sortBy,
  ]);

  const channelOptions = toMultiSelectOptions([...CHANNEL_TYPE_FILTER]);

  const channelInitialValue =
    selectedChannels.length > 0 ? selectedChannels.map((c) => String(c)) : undefined;

  const customToolbarFilters: ToolbarFilterConfig[] = [
    {
      id: 'channel',
      type: 'multi-select',
      label: t('interactionsFilterChannel'),
      multiSelectOptions: channelOptions,
      initialValue: channelInitialValue,
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
      id: 'queue',
      type: 'multi-select',
      label: t('interactionsFilterQueue'),
      multiSelectOptions: toQueueOptions(queues),
      initialValue:
        selectedQueueIds.length > 0
          ? selectedQueueIds.map((id) => String(id))
          : undefined,
      showSelectAll: true,
      disabled: queues.length === 0,
    },
    {
      id: 'disposition',
      type: 'multi-select',
      label: t('interactionsFilterDisposition'),
      multiSelectOptions: toDispositionOptions(dispositions),
      initialValue:
        selectedDispositions.length > 0 ? selectedDispositions : undefined,
      showSelectAll: true,
      disabled: dispositions.length === 0,
    },
  ];

  const consolidatedFilter: DataGridConsolidatedFilterConfig = {
    label: t('interactionsFiltersLabel'),
    iconName: 'funnel',
    filterSearchPlaceholder: t('interactionsFiltersSearchPlaceholder'),
    groups: [
      ['channel', 'dateAdded'],
      ['queue', 'disposition'],
    ],
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
      ? rawChannel.filter((v): v is ChannelTypeFilter =>
          (CHANNEL_TYPE_FILTER as readonly string[]).includes(v as string),
        )
      : [];
    setSelectedChannels(pickedChannels);

    const rawQueue = appliedFilters.queue;
    const pickedQueueIds = Array.isArray(rawQueue)
      ? rawQueue.map(Number).filter((id) => Number.isFinite(id))
      : [];
    setSelectedQueueIds(pickedQueueIds);

    const rawDisposition = appliedFilters.disposition;
    const pickedDispositions = Array.isArray(rawDisposition)
      ? rawDisposition.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : [];
    setSelectedDispositions(pickedDispositions);
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
      commitSearch.cancel();
      setSearchQuery(payload.searchValue);
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
      searchValue: searchInput,
      onSearchChange: (value) => {
        setSearchInput(value);
        commitSearch(value.trim());
      },
    },
  };

  const columns: GridColDef<Interaction>[] = useMemo(
    () => [
      {
        field: 'customer',
        headerName: t('interactionsColumnCustomerName'),
        width: 208,
        renderCell: (params: GridRenderCellParams<Interaction>) => (
          <IdentityCell kind="customer" name={params.row.customer.name} />
        ),
      },
      {
        field: 'channelDetail',
        headerName: t('interactionsColumnChannelDetail'),
        width: 174,
        sortable: false,
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
        renderCell: (params: GridRenderCellParams<Interaction>) => (
          <IdentityCell kind="user" name={params.row.user.name} />
        ),
      },
      {
        field: 'scoring',
        headerName: t('interactionsColumnScoring'),
        width: 144,
        sortable: false,
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
        sortable: false,
        renderCell: (params: GridRenderCellParams<Interaction, number>) => (
          <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
        ),
      },
      {
        field: 'holdTimeSeconds',
        headerName: t('interactionsColumnHoldTime'),
        width: 211,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Interaction, number>) => (
          <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
        ),
      },
      {
        field: 'ivrTimeSeconds',
        headerName: t('interactionsColumnIvrTime'),
        width: 211,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Interaction, number>) => (
          <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
        ),
      },
      {
        field: 'setupTimeSeconds',
        headerName: t('interactionsColumnSetupTime'),
        width: 211,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Interaction, number>) => (
          <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
        ),
      },
      {
        field: 'ringingTimeSeconds',
        headerName: t('interactionsColumnRingingTime'),
        width: 211,
        sortable: false,
        renderCell: (params: GridRenderCellParams<Interaction, number>) => (
          <IconTextCell iconName="timer" text={formatDuration(params.value ?? 0)} />
        ),
      },
      {
        field: 'dispositionClass',
        headerName: t('interactionsColumnDispositionClass'),
        width: 230,
        sortable: false,
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
      {
        field: 'actions',
        headerName: '',
        width: 64,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<Interaction>) => (
          <InteractionRowActions interaction={params.row} />
        ),
      },
    ],
    [t, channelColor],
  );

  const handleRefresh = () => {
    if (campaignId === null || resolvedCcId === undefined || processId === undefined) return;
    dispatch(
      fetchInteractions({
        ccId: resolvedCcId,
        processId,
        campaignIds: [campaignId],
        limit: paginationModel.pageSize,
        channelTypes: toChannelTypesParam(selectedChannels),
        queueIds: selectedQueueIds.length > 0 ? selectedQueueIds : undefined,
        dispositions: selectedDispositions.length > 0 ? selectedDispositions : undefined,
        customerName: searchQuery || undefined,
        sortBy,
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
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
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
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        checkboxSelection
        disableRowSelectionOnClick
        disableVirtualization
        pinnedColumns={{ right: ['actions'] }}
        pagination
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        rowCount={totalRows}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        emptyStateMessage={emptyStateMessage}
        sx={{ minHeight: 0, minWidth: 0 }}
      />
    </Box>
  );
}

export default Component;
