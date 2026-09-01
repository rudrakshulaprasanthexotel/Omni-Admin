import type { MouseEvent, ReactNode } from 'react';
import { HoverCard } from '@exotel-npm-dev/signal-design-system';
import { useCustomerHoverCard } from '../hooks/useCustomerHoverCard';
import { useUserHoverCard } from '../hooks/useUserHoverCard';

interface IdentityHoverCardProps {
  kind: 'customer' | 'user';
  name: string;
  customerId?: string;
  userId?: string;
  campaignId?: number;
  children: ReactNode;
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
  children,
}: IdentityHoverCardProps) => {
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
    <HoverCard
      variant={kind}
      data={card.data}
      disabled={!card.enabled}
      onOpenChange={card.onOpenChange}
      slotProps={{
        trigger: {
          onClick: stopCellActivation,
          sx: { height: '100%', minWidth: 0, display: 'flex', alignItems: 'center' },
        },
      }}
    >
      {children}
    </HoverCard>
  );
};

export default IdentityHoverCard;
