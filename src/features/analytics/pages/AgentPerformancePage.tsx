import { Box, Typography } from '@exotel-npm-dev/signal-design-system';

export function Component() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Typography variant="h4">Team Performance</Typography>
      <Typography variant="body1">
        Review agent productivity, handle times, and adherence across your team.
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Performance scorecards and trends will appear here.
      </Typography>
    </Box>
  );
}
