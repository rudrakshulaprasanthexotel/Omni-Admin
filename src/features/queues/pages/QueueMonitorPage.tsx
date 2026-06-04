import { Box, Typography } from '@exotel-npm-dev/signal-design-system';

export function Component() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Live Monitoring</Typography>
      <Typography variant="body1">
        Monitor active calls, agent statuses, and live queue activity in real time.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Real-time agent and call data will appear here.
      </Typography>
    </Box>
  );
}
