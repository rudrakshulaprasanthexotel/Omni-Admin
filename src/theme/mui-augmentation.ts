import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    custom: {
      highlight: string;
      loginBgColor: string;
    };
  }

  interface PaletteOptions {
    custom?: {
      highlight?: string;
      loginBgColor?: string;
    };
  }
}
