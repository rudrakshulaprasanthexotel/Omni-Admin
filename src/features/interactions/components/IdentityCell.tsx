import {
  Avatar,
  Box,
  Typography,
  getAvatarColors,
  getInitials,
} from '@exotel-npm-dev/signal-design-system';

interface IdentityCellProps {
  name: string;
  /** Customers get circular avatars, users (agents/supervisors) get rounded-square. */
  kind: 'customer' | 'user';
  secondary?: string;
  avatarUrl?: string;
}

/**
 * Renders the identity column cell — a small avatar next to the display name
 * (and optional secondary line). Avatar shape encodes identity type per the
 * UX guidelines and must not vary across surfaces. Avatar background + text
 * colors come from the Signal DS `getAvatarColors` helper, so contrast (AA)
 * and cross-surface stability are guaranteed.
 */
const IdentityCell = ({ name, kind, secondary, avatarUrl }: IdentityCellProps) => {
  const { bgcolor, color } = getAvatarColors(name);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, height: '100%' }}>
      <Avatar
        src={avatarUrl}
        alt={name}
        sx={{
          width: 32,
          height: 32,
          fontSize: 12,
          borderRadius: kind === 'customer' ? '50%' : 1,
          bgcolor,
          color,
        }}
      >
        {getInitials(name)}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap>
          {name}
        </Typography>
        {secondary ? (
          <Typography variant="caption" color="text.secondary" noWrap>
            {secondary}
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
};

export default IdentityCell;
