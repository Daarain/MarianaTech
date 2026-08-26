export const COLOURS = {

  ocean: {

    base: '#0C447C',

    light: '#378ADD',

    tint: '#E6F1FB',

  },

  reef: {

    base: '#0F6E56',

    light: '#1D9E75',

    tint: '#E1F5EE',

  },

  bio: {

    base: '#534AB7',

    light: '#7F77DD',

    tint: '#EEEDFE',

  },

  hazard: {

    base: '#A32D2D',

    light: '#E24B4A',

    tint: '#FCEBEB',

  },

  seafloor: {

    base: '#444441',

    light: '#888780',

    tint: '#F1EFE8',

  },

  background: '#0A1628',

  white: '#FFFFFF',

  textPrimary: '#F1EFE8',

  textSecondary: '#888780',

} as const;

export type ColourShade = {

  base: string;

  light: string;

  tint: string;

};