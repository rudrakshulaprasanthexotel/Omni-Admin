import { useState, type MouseEvent } from 'react';
import {
  ProfileCard,
  type AvatarSize,
  type ProfileCardSlotProps,
} from '@exotel-npm-dev/signal-design-system';
import { useCustomerHoverCard } from '../hooks/useCustomerHoverCard';
import { useUserHoverCard } from '../hooks/useUserHoverCard';

interface IdentityHoverCardProps {
  kind: 'customer' | 'user';
  name: string;
  customerId?: string;
  userId?: string;
  campaignId?: number;
  avatarSize?: AvatarSize;
  slotProps?: ProfileCardSlotProps;
}

const stopCellActivation = (event: MouseEvent) => {
  event.stopPropagation();
};

const IdentityHoverCard = ({
  kind,
  name,
  customerId,
  userId,
  campaignId,
  avatarSize = 'large',
  slotProps,
}: IdentityHoverCardProps) => {
  const [open, setOpen] = useState(false);
  const customer = useCustomerHoverCard({
    name,
    customerId: kind === 'customer' ? customerId : undefined,
    campaignId: kind === 'customer' ? campaignId : undefined,
  });
  const user = useUserHoverCard({
    name,
    userId: kind === 'user' ? userId : undefined,
  });
  const card = kind === 'customer' ? customer : user;

  return (
    <ProfileCard
      name={name}
      variant={kind}
      avatarSize={avatarSize}
      data={card.data}
      loading={card.loading}
      disabled={!card.enabled}
      open={open}
      onHoverIntent={card.onHoverIntent}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) card.onHoverIntent();
      }}
      slotProps={{
        ...slotProps,
        trigger: {
          ...slotProps?.trigger,
          onClick: (event) => {
            stopCellActivation(event);
            slotProps?.trigger?.onClick?.(event);
          },
        },
      }}
    />
  );
};

export default IdentityHoverCard;
