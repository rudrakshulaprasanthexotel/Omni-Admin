import type { IconName } from '@exotel-npm-dev/signal-design-system';
import { InteractionChannel, InteractionChannelType } from './types';

export const CHANNEL_ICON: Record<InteractionChannel, IconName> = {
  [InteractionChannel.CALL]: 'phone',
  [InteractionChannel.WHATSAPP]: 'whatsapp-logo',
  [InteractionChannel.SMS]: 'chat-text',
  [InteractionChannel.MAIL]: 'envelope-simple',
  [InteractionChannel.CHAT]: 'chats-circle',
};

export const CHANNEL_TYPE_ICON: Record<InteractionChannelType, IconName> = {
  [InteractionChannelType.INBOUND]: 'arrow-down-left',
  [InteractionChannelType.OUTBOUND_MANUAL]: 'arrow-up-right',
  [InteractionChannelType.OUTBOUND_MULTI_DIAL]: 'arrow-up-right',
  [InteractionChannelType.OUTBOUND_AUTO_DIAL]: 'arrow-up-right',
};
