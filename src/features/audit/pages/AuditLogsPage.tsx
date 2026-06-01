import { Box, Typography } from '@exotel-npm-dev/signal-design-system';

export function Component() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Audit Logs</Typography>
      <Typography variant="body1">
        Review a chronological record of system and user activity.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Audit entries will appear here.
      </Typography>
    </Box>
  );
}
