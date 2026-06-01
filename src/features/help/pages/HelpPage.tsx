import { Box, Typography } from '@exotel-npm-dev/signal-design-system';

export function Component() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Help</Typography>
      <Typography variant="body1">
        Find documentation, guides, and support resources.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Help articles and contact options will appear here.
      </Typography>
    </Box>
  );
}
