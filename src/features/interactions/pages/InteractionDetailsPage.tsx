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
import { useAppSelector } from '@/store/hooks';
import type { CampaignUserResponse, QueueDetailBean } from '@/boilerplate/cmsApis/models';
import type { DispositionCodeBean } from '@/services/apiClient/appServerApis';
import { selectContactCenterId } from '@/features/auth/authSlice';
import {
  selectAssignedCampaigns,
  selectAssignedCampaignsLoading,
  selectAssignedProcesses,
  selectAssignedProcessesLoading,
} from '@/features/process/processSlice';
import type { InteractionsFilters } from '../api';
import {
  useCampaignDispositions,
  useCampaignQaDenominator,
  useCampaignQueues,
  useCampaignUsers,
  useInteractions,
} from '../queries';
import {
  InteractionChannel,
  InteractionChannelType,
  type Interaction,
} from '../types';
import IdentityHoverCard from '../components/IdentityHoverCard';
import InteractionRowActions from '../components/InteractionRowActions';
import { SelectorAvatar, SelectorListItem } from '../components/SelectorEntity';
import { CHANNEL_ICON, CHANNEL_TYPE_ICON } from '../constants';
import { formatDuration, formatShortDate } from '../utils/formatInteraction';
import { mapInteractionRows } from '../utils/mapInteraction';

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
const UNKNOWN_ROW_COUNT = -1;
const SEARCH_DEBOUNCE_MS = 400;

const PAGE_PARAM = 'page';
const PAGE_SIZE_PARAM = 'pageSize';
const BEFORE_CURSOR_PARAM = 'before';
const AFTER_CURSOR_PARAM = 'after';
const CHANNEL_PARAM = 'channel';
const USER_PARAM = 'user';
const QUEUE_PARAM = 'queue';
const DISPOSITION_PARAM = 'disposition';
const SEARCH_PARAM = 'q';
const SORT_PARAM = 'sort';

const CAMPAIGN_SCOPED_PARAMS = [
  CHANNEL_PARAM,
  USER_PARAM,
  QUEUE_PARAM,
  DISPOSITION_PARAM,
  SEARCH_PARAM,
  PAGE_PARAM,
  BEFORE_CURSOR_PARAM,
  AFTER_CURSOR_PARAM,
];

type PaginationModel = { page: number; pageSize: number };

const parsePage = (value: string | null): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
};

const parsePageSize = (value: string | null): number => {
  const parsed = Number(value);
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : DEFAULT_PAGE_SIZE;
};

const parseSortModel = (value: string | null): SortModel => {
  if (value === null) return DEFAULT_SORT_MODEL;
  return value
    .split(',')
    .map((entry): SortModel[number] | null => {
      const [field, direction] = entry.split(':');
      if (!field || !SORT_FIELD_TO_WIRE[field]) return null;
      return { field, sort: direction === 'desc' ? 'desc' : 'asc' };
    })
    .filter((entry) => entry != null);
};

const toSortParam = (model: SortModel): string =>
  model.map(({ field, sort }) => `${field}:${sort ?? 'asc'}`).join(',');

const setListParam = (params: URLSearchParams, key: string, values: string[]): void => {
  params.delete(key);
  values.forEach((value) => params.append(key, value));
};

const setOptionalParam = (
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void => {
  if (value) {
    params.set(key, value);
  } else {
    params.delete(key);
  }
};

const clearCampaignScopedParams = (params: URLSearchParams): void => {
  CAMPAIGN_SCOPED_PARAMS.forEach((key) => params.delete(key));
};

const clearPageParams = (params: URLSearchParams): void => {
  params.delete(PAGE_PARAM);
  params.delete(BEFORE_CURSOR_PARAM);
  params.delete(AFTER_CURSOR_PARAM);
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

const toUserOptions = (users: CampaignUserResponse[]): MultiSelectOption[] =>
  users
    .filter((user): user is CampaignUserResponse & { userId: string } =>
      typeof user.userId === 'string' && user.userId.length > 0,
    )
    .map((user) => ({
      id: user.userId,
      value: user.userId,
      label: user.userName?.trim() || user.userId,
    }));

export function Component() {
  const { t } = useTranslation();
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
  const campaigns = useAppSelector(selectAssignedCampaigns);
  const campaignsLoading = useAppSelector(selectAssignedCampaignsLoading);
  const processes = useAppSelector(selectAssignedProcesses);
  const processesLoading = useAppSelector(selectAssignedProcessesLoading);

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

  const page = parsePage(searchParams.get(PAGE_PARAM));
  const pageSize = parsePageSize(searchParams.get(PAGE_SIZE_PARAM));
  const beforeCursorParam = searchParams.get(BEFORE_CURSOR_PARAM);
  const afterCursorParam = searchParams.get(AFTER_CURSOR_PARAM);
  const sortParam = searchParams.get(SORT_PARAM);
  // The grid compares `sortModel` by reference and resets the page whenever it
  // changes, so the parsed model has to keep its identity between renders.
  const [sortModel, setSortModel] = useState<SortModel>(() => parseSortModel(sortParam));
  const [prevSortParam, setPrevSortParam] = useState(sortParam);
  if (prevSortParam !== sortParam) {
    setPrevSortParam(sortParam);
    setSortModel(parseSortModel(sortParam));
  }
  const sortBy = toSortBy(sortModel);
  const selectedChannels = searchParams
    .getAll(CHANNEL_PARAM)
    .filter((value): value is ChannelTypeFilter =>
      (CHANNEL_TYPE_FILTER as readonly string[]).includes(value),
    );
  const selectedQueueIds = searchParams
    .getAll(QUEUE_PARAM)
    .map(Number)
    .filter((id) => Number.isFinite(id));
  const selectedDispositions = searchParams.getAll(DISPOSITION_PARAM);
  const selectedUserIds = searchParams.getAll(USER_PARAM);
  const searchQuery = searchParams.get(SEARCH_PARAM) ?? '';

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [campaignSearch, setCampaignSearch] = useState('');

  const campaignScope = {
    contactCenterId: resolvedCcId,
    processId,
    campaignId,
  };
  const { data: queues = [] } = useCampaignQueues(campaignId);
  const { data: dispositions = [] } = useCampaignDispositions(campaignId);
  const { data: users = [] } = useCampaignUsers(campaignScope);
  const { data: qaDenominator } = useCampaignQaDenominator(campaignScope);

  const updateParams = (mutate: (params: URLSearchParams) => void) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        mutate(params);
        return params;
      },
      { replace: true },
    );
  };

  const [prevProcessId, setPrevProcessId] = useState<number | null>(selectedProcessId);
  if (prevProcessId !== selectedProcessId) {
    setPrevProcessId(selectedProcessId);
    setCampaignSearch('');
  }

  const [prevCampaignId, setPrevCampaignId] = useState<number | null>(campaignId);
  if (prevCampaignId !== campaignId) {
    setPrevCampaignId(campaignId);
    setSearchInput(searchQuery);
  }

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed === searchQuery) return;

    const timer = setTimeout(() => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          setOptionalParam(params, SEARCH_PARAM, trimmed);
          clearPageParams(params);
          return params;
        },
        { replace: true },
      );
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, setSearchParams]);

  useEffect(() => {
    if (firstProcessId === null) return;
    if (isProcessAssigned) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('processId', String(firstProcessId));
        next.delete('campaignId');
        clearPageParams(next);
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
        clearPageParams(next);
        return next;
      },
      { replace: true },
    );
  }, [firstCampaignIdInProcess, isCampaignInProcess, setSearchParams]);

  let filters: InteractionsFilters | null = null;
  if (campaignId !== null && resolvedCcId !== undefined && processId !== undefined) {
    filters = {
      ccId: resolvedCcId,
      processId,
      campaignIds: [campaignId],
      limit: pageSize,
      beforeCursor: beforeCursorParam ?? undefined,
      afterCursor: afterCursorParam ?? undefined,
      channelTypes: toChannelTypesParam(selectedChannels),
      queueIds: selectedQueueIds.length > 0 ? selectedQueueIds : undefined,
      dispositions: selectedDispositions.length > 0 ? selectedDispositions : undefined,
      userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      customerName: searchQuery || undefined,
      sortBy,
    };
  }

  const { data: interactionsPage, isFetching, isError, refetch } = useInteractions(filters);

  const rows = mapInteractionRows(
    interactionsPage?.rows ?? [],
    campaignId !== null && qaDenominator != null ? { [campaignId]: qaDenominator } : {},
  );
  const totalRows = interactionsPage?.totalRows ?? -1;
  const beforeCursor = interactionsPage?.beforeCursor ?? null;
  const afterCursor = interactionsPage?.afterCursor ?? null;

  const channelOptions = toMultiSelectOptions([...CHANNEL_TYPE_FILTER]);

  const channelInitialValue =
    selectedChannels.length > 0 ? selectedChannels.map((c) => String(c)) : undefined;

  const customToolbarFilters: ToolbarFilterConfig[] = [
    {
      id: 'channel',
      type: 'multi-select',
      label: t('interactionsFilterChannel'),
      iconName: 'chats-circle',
      multiSelectOptions: channelOptions,
      initialValue: channelInitialValue,
    },
    {
      id: 'user',
      type: 'multi-select',
      label: t('interactionsFilterUser'),
      iconName: 'user',
      multiSelectOptions: toUserOptions(users),
      initialValue: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      showSelectAll: true,
      disabled: users.length === 0,
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
      iconName: 'queue',
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
      iconName: 'tag',
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
    filterStoreId: campaignId != null ? String(campaignId) : undefined,
  };

  // Clearing the campaign is intentional — the effect above then lands on the
  // new process's first campaign.
  const handleProcessSelect = (nextProcessId: number) => {
    if (nextProcessId === selectedProcessId) return;
    updateParams((params) => {
      params.set('processId', String(nextProcessId));
      params.delete('campaignId');
      clearCampaignScopedParams(params);
    });
  };

  const handleCampaignSelect = (nextCampaignId: number) => {
    if (nextCampaignId === campaignId) return;
    updateParams((params) => {
      params.set('campaignId', String(nextCampaignId));
      clearCampaignScopedParams(params);
    });
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
        <SelectorAvatar name={activeCampaign.campaignName} kind="campaign" />
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

    const rawQueue = appliedFilters.queue;
    const pickedQueueIds = Array.isArray(rawQueue)
      ? rawQueue.map(Number).filter((id) => Number.isFinite(id))
      : [];

    const rawDisposition = appliedFilters.disposition;
    const pickedDispositions = Array.isArray(rawDisposition)
      ? rawDisposition.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : [];

    const rawUser = appliedFilters.user;
    const pickedUserIds = Array.isArray(rawUser)
      ? rawUser.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : [];

    updateParams((params) => {
      setListParam(params, CHANNEL_PARAM, pickedChannels);
      setListParam(params, QUEUE_PARAM, pickedQueueIds.map(String));
      setListParam(params, DISPOSITION_PARAM, pickedDispositions);
      setListParam(params, USER_PARAM, pickedUserIds);
      clearPageParams(params);
    });
  };

  // Title badge only renders a count once the backend surfaces a real integer.
  // Delta noted in §4 row #16 (real integer `metadata.total`).
  const tableHeader: DataGridTableHeaderProps = {
    title:
      totalRows >= 0
        ? `${t('interactionsPageTitle')} (${totalRows})`
        : t('interactionsPageTitle'),
    showSearch: true,
    searchType: 'advanced',
    onAdvanceSearch: (payload: AdvancedSearchPayload) => {
      setSearchInput(payload.searchValue);
      updateParams((params) => {
        setOptionalParam(params, SEARCH_PARAM, payload.searchValue.trim());
        clearPageParams(params);
      });
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
      onSearchChange: setSearchInput,
    },
  };

  const columns: GridColDef<Interaction>[] = useMemo(
    () => [
      {
        field: 'customer',
        headerName: t('interactionsColumnCustomerName'),
        width: 208,
        renderCell: (params: GridRenderCellParams<Interaction>) => (
          <IdentityHoverCard
            kind="customer"
            name={params.row.customer.name}
            customerId={params.row.customer.id}
            campaignId={params.row.campaignId ?? campaignId ?? undefined}
          />
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
          <IdentityHoverCard
            kind="user"
            name={params.row.user.name}
            userId={params.row.user.id}
          />
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
        width: 104,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params: GridRenderCellParams<Interaction>) => (
          <InteractionRowActions interaction={params.row} />
        ),
      },
    ],
    [t, channelColor, campaignId],
  );

  const handleRefresh = () => {
    void refetch();
  };

  const handlePaginationModelChange = (nextModel: PaginationModel) => {
    if (nextModel.pageSize !== pageSize) {
      updateParams((params) => {
        params.set(PAGE_SIZE_PARAM, String(nextModel.pageSize));
        clearPageParams(params);
      });
      return;
    }

    if (nextModel.page === page) return;

    if (nextModel.page === 0) {
      updateParams(clearPageParams);
      return;
    }

    const isForward = nextModel.page > page;
    const cursor = isForward ? afterCursor : beforeCursor;
    if (!cursor) return;

    updateParams((params) => {
      clearPageParams(params);
      params.set(PAGE_PARAM, String(nextModel.page));
      params.set(isForward ? AFTER_CURSOR_PARAM : BEFORE_CURSOR_PARAM, cursor);
    });
  };

  const handleSortModelChange = (nextSortModel: SortModel) => {
    const nextSortParam = toSortParam(nextSortModel);
    if (nextSortParam === toSortParam(sortModel)) return;
    updateParams((params) => {
      params.set(SORT_PARAM, nextSortParam);
      clearPageParams(params);
    });
  };

  const paginationModel: PaginationModel = { page, pageSize };
  const isLastPageLoaded = !afterCursor && rows.length > 0;
  const rowCount = isLastPageLoaded ? page * pageSize + rows.length : UNKNOWN_ROW_COUNT;

  const emptyStateMessage = campaignId === null
    ? t('interactionsSelectCampaign')
    : isError
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
        getRowId={(row: Interaction) => row.uniqueId}
        columns={columns}
        loading={isFetching}
        tableHeader={tableHeader}
        customToolbarFilters={customToolbarFilters}
        consolidatedFilter={consolidatedFilter}
        nestedList={nestedList}
        onRefresh={handleRefresh}
        onToolbarFiltersChange={handleToolbarFiltersChange}
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
        checkboxSelection
        disableRowSelectionOnClick
        disableVirtualization
        pinnedColumns={{ right: ['actions'] }}
        pagination
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        rowCount={rowCount}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        emptyStateMessage={emptyStateMessage}
        sx={{ minHeight: 0, minWidth: 0 }}
      />
    </Box>
  );
}

export default Component;
