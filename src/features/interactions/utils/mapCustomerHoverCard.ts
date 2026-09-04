import type { TFunction } from 'i18next';
import type { ProfileCardData, ProfileCardDetail } from '@exotel-npm-dev/signal-design-system';
import { displayValue, formatShortDate } from './formatInteraction';
import type { CustomerHoverInfo } from './hoverCardPayload';

interface MapCustomerHoverCardArgs {
  fallbackName: string;
  info: CustomerHoverInfo;
  channelColors: {
    call: string;
    whatsapp: string;
    mail: string;
  };
  t: TFunction;
}

function formatCreatedAt(epoch?: number): string | undefined {
  if (epoch == null) return undefined;
  const date = new Date(epoch);
  if (Number.isNaN(date.getTime())) return undefined;
  return formatShortDate(date.toISOString());
}

export function mapCustomerHoverCard({
  fallbackName,
  info,
  channelColors,
  t,
}: MapCustomerHoverCardArgs): ProfileCardData {
  const details: ProfileCardDetail[] = [
    { id: 'customerId', label: t('hoverCardCustomerId'), value: displayValue(info.customerId) },
    { id: 'firstName', label: t('hoverCardFirstName'), value: displayValue(info.firstName) },
    { id: 'lastName', label: t('hoverCardLastName'), value: displayValue(info.lastName) },
    { id: 'email', label: t('hoverCardEmail'), value: displayValue(info.email) },
    { id: 'phone1', label: t('hoverCardPhone1'), value: displayValue(info.phone1) },
    { id: 'phone2', label: t('hoverCardPhone2'), value: displayValue(info.phone2) },
    {
      id: 'createdAt',
      label: t('hoverCardCreatedAt'),
      value: displayValue(formatCreatedAt(info.createdAtEpoch)),
    },
    { id: 'processId', label: t('hoverCardProcessId'), value: displayValue(info.processId) },
    { id: 'leadId', label: t('hoverCardLeadId'), value: displayValue(info.leadId) },
  ];

  return {
    title: info.title ?? fallbackName,
    action: {
      label: t('hoverCardViewCrm'),
    },
    iconActions: [
      {
        id: 'call',
        icon: 'phone',
        label: t('hoverCardCall'),
        color: channelColors.call,
      },
      {
        id: 'whatsapp',
        icon: 'whatsapp-logo',
        label: t('hoverCardWhatsApp'),
        color: channelColors.whatsapp,
      },
      {
        id: 'mail',
        icon: 'envelope-simple',
        label: t('hoverCardMail'),
        color: channelColors.mail,
      },
    ],
    details,
  };
}
