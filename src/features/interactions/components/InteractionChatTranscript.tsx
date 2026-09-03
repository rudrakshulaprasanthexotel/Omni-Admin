import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  Typography,
  getAvatarColors,
  getInitials,
} from '@exotel-npm-dev/signal-design-system';
import type { Interaction } from '../types';
import { formatMessageTime, isPresent } from '../utils/formatInteraction';
import type { ChatTranscriptMessage } from '../utils/mapChatTranscript';

interface InteractionChatTranscriptProps {
  messages: ChatTranscriptMessage[];
  interaction: Interaction;
}

const ChatBubble = ({
  message,
  interaction,
}: {
  message: ChatTranscriptMessage;
  interaction: Interaction;
}) => {
  const { t } = useTranslation();
  const isCustomer = message.speaker === 'customer';
  const identityName = isCustomer ? interaction.customer.name : interaction.user.name;
  const avatarName = isPresent(message.name) ? message.name : identityName;
  const displayName = isCustomer
    ? isPresent(message.name)
      ? message.name
      : identityName
    : t('rightPanelTranscriptYou');
  const { bgcolor, color } = getAvatarColors(isPresent(avatarName) ? avatarName : displayName);
  const time = message.timestamp ? formatMessageTime(message.timestamp) : undefined;
  const avatarSrc = isCustomer ? interaction.customer.avatarUrl : interaction.user.avatarUrl;

  return (
    <Box
      display="flex"
      alignItems="flex-start"
      gap={0.75}
      justifyContent={isCustomer ? 'flex-start' : 'flex-end'}
      pr={isCustomer ? 7 : 0}
      pl={isCustomer ? 0 : 7}
      width="100%"
    >
      {isCustomer ? (
        <Avatar
          src={avatarSrc}
          alt={displayName}
          variant="circular"
          sx={{
            width: 24,
            height: 24,
            fontSize: 11,
            bgcolor,
            color,
            flexShrink: 0,
          }}
        >
          {getInitials(isPresent(avatarName) ? avatarName : displayName)}
        </Avatar>
      ) : null}
      <Box
        display="flex"
        flexDirection="column"
        gap={1}
        p={1.5}
        minWidth={0}
        flex={1}
        sx={{
          borderRadius: isCustomer ? '4px 12px 12px 12px' : '12px 4px 12px 12px',
          bgcolor: isCustomer ? 'surface.elevation0' : 'primary.states.focus',
          ...(!isCustomer && { border: 1, borderColor: 'divider' }),
        }}
      >
        <Box display="flex" alignItems="center" gap={1} minWidth={0}>
          <Typography variant="subtitle2" fontWeight={500} noWrap>
            {displayName}
          </Typography>
          {time ? (
            <Typography variant="caption" color="text.secondary">
              {time}
            </Typography>
          ) : null}
        </Box>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {message.text}
        </Typography>
      </Box>
      {isCustomer ? null : (
        <Avatar
          src={avatarSrc}
          alt={displayName}
          variant="rounded"
          sx={{
            width: 24,
            height: 24,
            fontSize: 11,
            bgcolor,
            color,
            flexShrink: 0,
          }}
        >
          {getInitials(isPresent(avatarName) ? avatarName : displayName)}
        </Avatar>
      )}
    </Box>
  );
};

const InteractionChatTranscript = ({
  messages,
  interaction,
}: InteractionChatTranscriptProps) => (
  <Box display="flex" flexDirection="column" gap={3} width="100%">
    {messages.map((message) => (
      <ChatBubble key={message.id} message={message} interaction={interaction} />
    ))}
  </Box>
);

export default InteractionChatTranscript;
