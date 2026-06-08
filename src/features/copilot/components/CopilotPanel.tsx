import { useState } from 'react';
import { Box, ChatInputBox, Drawer, Icon, Typography } from '@exotel-npm-dev/signal-design-system';

interface CopilotPanelProps {
  open: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  author: 'user' | 'assistant';
  text: string;
}

const CopilotPanel = ({ open, onClose }: CopilotPanelProps) => {
  const [value, setValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), author: 'user', text: trimmed },
      {
        id: crypto.randomUUID(),
        author: 'assistant',
        text: "This is a placeholder response. I'll be able to help with that soon!",
      },
    ]);
    setValue('');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      title="Copilot"
      PaperProps={{ sx: { width: { xs: '100%', sm: 400 } } }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon name="sparkle" weight="fill" color="custom.copilotAccent" />
                <Typography variant="h6">Hello! How can I help?</Typography>
              </Box>
              <Typography variant="body1" color="text.secondary">
                I'm your Omni Admin Copilot. Ask me anything about users, queues, analytics, or
                settings, and I'll help you get things done faster.
              </Typography>
            </Box>
          ) : (
            messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  alignSelf: message.author === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor:
                    message.author === 'user' ? 'primary.main' : 'surface.elevation2',
                  color: message.author === 'user' ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="body2">{message.text}</Typography>
              </Box>
            ))
          )}
        </Box>
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <ChatInputBox
            value={value}
            onChange={setValue}
            onSend={handleSend}
            placeholder="Ask Copilot anything..."
          />
        </Box>
      </Box>
    </Drawer>
  );
};

export default CopilotPanel;
