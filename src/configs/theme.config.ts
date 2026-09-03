import { type ThemeOptions } from '@exotel-npm-dev/signal-design-system';

export const theme: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        custom: {
          loginBgColor: '#fffaeb',
          carouselDotActive: '#333',
          carouselDotInactive: '#d9d9d9',
          aiInputBoxShadow: '0px 4px 8px -2px rgba(10,13,18,0.1), 0px 2px 4px -2px rgba(0,0,0,0.06)',
          aiIconGradient: 'linear-gradient(219deg, #394FB6 5%, #5E79D5 51%, #394FB6 96%)',
          aiIconBoxShadow: '0px 0.625px 0.625px -0.313px rgba(10,13,18,0.13), 0px 0.625px 1.875px 0px rgba(10,13,18,0.1)',
          loadingOverlayBg: 'rgba(255, 255, 255, 0.6)',
          channelCall: '#2E7D32',
          channelWhatsApp: '#25D366',
          channelSms: '#0288D1',
          channelMail: '#1976D2',
          channelChat: '#7B1FA2',
        },
      },
    },
    dark: {
      palette: {
        custom: {
          loginBgColor: '#232323',
          carouselDotActive: '#fff',
          carouselDotInactive: '#555',
          aiInputBoxShadow: '0px 4px 8px -2px rgba(0,0,0,0.3), 0px 2px 4px -2px rgba(0,0,0,0.2)',
          aiIconGradient: 'linear-gradient(219deg, #394FB6 5%, #5E79D5 51%, #394FB6 96%)',
          aiIconBoxShadow: '0px 0.625px 0.625px -0.313px rgba(0,0,0,0.3), 0px 0.625px 1.875px 0px rgba(0,0,0,0.2)',
          loadingOverlayBg: 'rgba(0, 0, 0, 0.4)',
          channelCall: '#66BB6A',
          channelWhatsApp: '#4ADE80',
          channelSms: '#4FC3F7',
          channelMail: '#64B5F6',
          channelChat: '#CE93D8',
        },
      },
    },
  }
};
