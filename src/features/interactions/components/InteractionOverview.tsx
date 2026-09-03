import { useMemo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  Divider,
  Icon,
  Typography,
  getAvatarColors,
  getInitials,
  useTheme,
} from '@exotel-npm-dev/signal-design-system';
import { CHANNEL_ICON, CHANNEL_TYPE_ICON } from '../constants';
import {
  InteractionChannel,
  InteractionChannelType,
  type Interaction,
} from '../types';
import {
  displayValue,
  formatDuration,
  formatShortDate,
  isPresent,
} from '../utils/formatInteraction';
import IdentityHoverCard from './IdentityHoverCard';

const LABEL_WIDTH = 147;

const OverviewRow = ({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) => (
  <Box display="flex" alignItems="flex-start" gap={0.25} width="100%" minWidth={0}>
    <Typography variant="subtitle2" fontWeight={500} width={LABEL_WIDTH} flexShrink={0}>
      {label}
    </Typography>
    <Typography variant="body2" color="text.secondary" flexShrink={0}>
      :
    </Typography>
    <Box display="flex" alignItems="flex-start" gap={0.5} minWidth={0} flex={1}>
      {children}
    </Box>
  </Box>
);

const OverviewText = ({ value }: { value: string | number | undefined | null }) => (
  <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
    {displayValue(value)}
  </Typography>
);

const OverviewIdentity = ({
  name,
  kind,
}: {
  name: string;
  kind: 'customer' | 'user';
}) => {
  const displayName = displayValue(name);
  const { bgcolor, color } = getAvatarColors(isPresent(name) ? name : displayName);

  return (
    <>
      <Avatar
        alt={displayName}
        variant={kind === 'customer' ? 'circular' : 'rounded'}
        sx={{
          width: 24,
          height: 24,
          fontSize: 12,
          bgcolor,
          color,
        }}
      >
        {isPresent(name) ? getInitials(name) : displayName}
      </Avatar>
      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
        {displayName}
      </Typography>
    </>
  );
};

interface InteractionOverviewProps {
  interaction: Interaction;
}

const InteractionOverview = ({ interaction }: InteractionOverviewProps) => {
  const { t } = useTranslation();
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

  const typeIconColor =
    interaction.channelType === InteractionChannelType.INBOUND
      ? theme.palette.success.main
      : undefined;

  const startDate = interaction.startDate || interaction.dateAdded;

  return (
    <Box display="flex" flexDirection="column" gap={1.5} width="100%">
      <Box display="flex" flexDirection="column" gap={1.5} width="100%">
        <OverviewRow label={t('interactionsColumnCampaign')}>
          <OverviewText value={interaction.campaign} />
        </OverviewRow>
        <OverviewRow label={t('interactionsColumnChannel')}>
          <Icon
            name={CHANNEL_ICON[interaction.channel]}
            size="sm"
            color={channelColor[interaction.channel]}
          />
          <OverviewText value={interaction.channel} />
        </OverviewRow>
        <OverviewRow label={t('rightPanelType')}>
          <Icon
            name={CHANNEL_TYPE_ICON[interaction.channelType]}
            size="sm"
            color={typeIconColor}
          />
          <OverviewText value={interaction.channelType} />
        </OverviewRow>
        <OverviewRow label={t('interactionsColumnQueue')}>
          <OverviewText value={interaction.queue} />
        </OverviewRow>
        <OverviewRow label={t('rightPanelDid')}>
          <OverviewText value={interaction.did} />
        </OverviewRow>
      </Box>

      <Divider />

      <Box display="flex" flexDirection="column" gap={1.5} width="100%">
        <OverviewRow label={t('interactionsColumnCustomerName')}>
          <IdentityHoverCard
            kind="customer"
            name={interaction.customer.name}
            customerId={interaction.customer.id}
            campaignId={interaction.campaignId}
          >
            <OverviewIdentity kind="customer" name={interaction.customer.name} />
          </IdentityHoverCard>
        </OverviewRow>
        <OverviewRow label={t('interactionsColumnUser')}>
          <IdentityHoverCard
            kind="user"
            name={interaction.user.name}
            userId={interaction.user.id}
          >
            <OverviewIdentity kind="user" name={interaction.user.name} />
          </IdentityHoverCard>
        </OverviewRow>
        <OverviewRow label={t('interactionsColumnChannelDetail')}>
          <OverviewText value={interaction.channelDetail} />
        </OverviewRow>
        <OverviewRow label={t('rightPanelCaseId')}>
          <OverviewText value={interaction.caseId} />
        </OverviewRow>
        <OverviewRow label={t('rightPanelInteractionId')}>
          <OverviewText value={interaction.id} />
        </OverviewRow>
        <OverviewRow label={t('rightPanelStartDate')}>
          <OverviewText value={isPresent(startDate) ? formatShortDate(startDate) : undefined} />
        </OverviewRow>
        <OverviewRow label={t('rightPanelEndDate')}>
          <OverviewText
            value={isPresent(interaction.endDate) ? formatShortDate(interaction.endDate) : undefined}
          />
        </OverviewRow>
        <OverviewRow label={t('rightPanelCallDuration')}>
          <OverviewText
            value={
              interaction.interactionTimeSeconds > 0
                ? formatDuration(interaction.interactionTimeSeconds)
                : undefined
            }
          />
        </OverviewRow>
        <OverviewRow label={t('rightPanelDisposition')}>
          <OverviewText value={interaction.dispositionCode} />
        </OverviewRow>
        <OverviewRow label={t('rightPanelSubDisposition')}>
          <OverviewText value={interaction.dispositionClass} />
        </OverviewRow>
        {interaction.extraFields.map((field) => (
          <OverviewRow key={field.key} label={field.label}>
            <OverviewText value={field.value} />
          </OverviewRow>
        ))}
      </Box>
    </Box>
  );
};

export default InteractionOverview;
