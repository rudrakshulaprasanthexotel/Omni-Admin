import {
  Avatar,
  Box,
  Typography,
  getAvatarColors,
  getInitials,
} from '@exotel-npm-dev/signal-design-system';

/** Processes read as neutral scaffolding; campaigns are the thing being picked. */
type SelectorEntityKind = 'process' | 'campaign';

interface SelectorAvatarProps {
  name: string;
  kind: SelectorEntityKind;
  size?: number;
}

export const SelectorAvatar = ({ name, kind, size = 24 }: SelectorAvatarProps) => {
  // Campaign colors come from the Signal DS `getAvatarColors` helper, so a
  // campaign keeps the same swatch across the trigger and the child list.
  const { bgcolor, color } =
    kind === 'campaign'
      ? getAvatarColors(name)
      : { bgcolor: 'grey.600', color: 'common.white' };

  return (
    <Avatar
      alt={name}
      sx={{
        width: size,
        height: size,
        fontSize: size / 2.4,
        borderRadius: 0.75,
        bgcolor,
        color,
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
