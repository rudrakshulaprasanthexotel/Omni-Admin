import {
  Avatar,
  Box,
  Typography,
  getAvatarColors,
  getInitials,
  type AvatarSize,
} from '@exotel-npm-dev/signal-design-system';

/** Processes read as neutral scaffolding; campaigns are the thing being picked. */
type SelectorEntityKind = 'process' | 'campaign';

/** Signal's Avatar scale. Only the `collection` variant reads `size` natively. */
const AVATAR_SIZE_PX: Record<AvatarSize, number> = {
  small: 18,
  medium: 24,
  large: 32,
  extraLarge: 40,
};

interface SelectorAvatarProps {
  name: string;
  kind: SelectorEntityKind;
  size?: AvatarSize;
}

export const SelectorAvatar = ({ name, kind, size = 'medium' }: SelectorAvatarProps) => {
  // Campaign colors come from the Signal DS `getAvatarColors` helper, so a
  // campaign keeps the same swatch across the trigger and the child list.
  if (kind === 'campaign') {
    const { bgcolor, color } = getAvatarColors(name);

    return (
      <Avatar
        variant="collection"
        size={size}
        bgcolor={bgcolor}
        color={color}
        alt={name}
      >
        {getInitials(name)}
      </Avatar>
    );
  }

  const sizePx = AVATAR_SIZE_PX[size];

  return (
    <Avatar
      alt={name}
      sx={{
        width: sizePx,
        height: sizePx,
        fontSize: sizePx / 2.4,
        borderRadius: 0.75,
        bgcolor: 'grey.600',
        color: 'common.white',
      }}
    >
      {getInitials(name)}
    </Avatar>
  );
};

/**
 * `NestedList` supplies the `ListItemButton`, selected styling and trailing
 * caret, so a row body only renders the avatar + name.
 */
export const SelectorListItem = ({ name, kind }: { name: string; kind: SelectorEntityKind }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1 }}>
    <SelectorAvatar name={name} kind={kind} />
    <Typography variant="body2" noWrap>
      {name}
    </Typography>
  </Box>
);
