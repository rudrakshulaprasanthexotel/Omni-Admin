import { type ThemeOptions } from '@exotel-npm-dev/signal-design-system';

export const theme: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        custom: {
          loginBgColor: '#fffaeb',
          carouselDotActive: '#333',
          carouselDotInactive: '#d9d9d9',
          copilotAccent: '#7C4DFF',
          aiInputBoxShadow: '0px 4px 8px -2px rgba(10,13,18,0.1), 0px 2px 4px -2px rgba(0,0,0,0.06)',
          aiIconGradient: 'linear-gradient(219deg, #394FB6 5%, #5E79D5 51%, #394FB6 96%)',
          aiIconBoxShadow: '0px 0.625px 0.625px -0.313px rgba(10,13,18,0.13), 0px 0.625px 1.875px 0px rgba(10,13,18,0.1)',
        },
      },
    },
    dark: {
      palette: {
        custom: {
          loginBgColor: '#232323',
          carouselDotActive: '#fff',
          carouselDotInactive: '#555',
          copilotAccent: '#B388FF',
          aiInputBoxShadow: '0px 4px 8px -2px rgba(0,0,0,0.3), 0px 2px 4px -2px rgba(0,0,0,0.2)',
          aiIconGradient: 'linear-gradient(219deg, #394FB6 5%, #5E79D5 51%, #394FB6 96%)',
          aiIconBoxShadow: '0px 0.625px 0.625px -0.313px rgba(0,0,0,0.3), 0px 0.625px 1.875px 0px rgba(0,0,0,0.2)',
        },
      },
    },
  }
};
