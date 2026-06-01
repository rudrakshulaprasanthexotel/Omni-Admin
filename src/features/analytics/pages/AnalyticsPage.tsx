import { Box, Typography } from '@exotel-npm-dev/signal-design-system';

export function Component() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Analytics</Typography>
      <Typography variant="body1">
        Track key metrics, trends, and performance insights across your contact center.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Reports and dashboards will appear here.
      </Typography>
    </Box>
  );
}
