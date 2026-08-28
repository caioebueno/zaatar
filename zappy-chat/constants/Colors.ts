export const lightC = {
  mode: 'light' as const,
  orange: '#ff3d14',
  ink: '#16120f',
  ink2: '#2a231e',
  muted: '#6c6259',
  faint: '#9b9088',
  hairline: 'rgba(22,18,15,0.08)',
  hairlineSoft: 'rgba(22,18,15,0.05)',
  cream: '#faf5ee',
  paper: '#fffdf9',
  paperSink: '#f4ecdd',
  needs: '#ff3d14',
  needsBg: '#ffe2da',
  needsFg: '#8a1c06',
  needsRowTint: 'rgba(255,61,20,0.04)',
  live: '#00a866',
  liveBg: '#e6f7ee',
  liveFg: '#006e44',
  bot: '#6c6259',
  botBg: '#efe7da',
  botFg: '#2a231e',
  resolved: '#9b9088',
  fabBg: '#16120f',
  fabFg: '#faf5ee',
  pillActiveBg: '#16120f',
  pillActiveFg: '#faf5ee',
  pillIdleBg: '#fffdf9',
  pillIdleFg: '#2a231e',
  pillCountActive: 'rgba(250,245,238,0.7)',
  avatarMonoBg: '#16120f',
  avatarMonoFg: '#faf5ee',
  scrim: '#e9e1d2',
  tabActive: '#16120f',
  tabInactive: '#9b9088',
};

export const darkC = {
  mode: 'dark' as const,
  orange: '#ff5a35',
  ink: '#faf5ee',
  ink2: '#ebe3d5',
  muted: '#a89e92',
  faint: '#6c6259',
  hairline: 'rgba(250,245,238,0.08)',
  hairlineSoft: 'rgba(250,245,238,0.04)',
  cream: '#16120f',
  paper: '#221c17',
  paperSink: '#1a1612',
  needs: '#ff5a35',
  needsBg: 'rgba(255,90,53,0.14)',
  needsFg: '#ffb09e',
  needsRowTint: 'rgba(255,90,53,0.06)',
  live: '#33c98a',
  liveBg: 'rgba(51,201,138,0.12)',
  liveFg: '#8fe4bc',
  bot: '#a89e92',
  botBg: 'rgba(250,245,238,0.06)',
  botFg: '#ebe3d5',
  resolved: '#6c6259',
  fabBg: '#ff3d14',
  fabFg: '#faf5ee',
  pillActiveBg: '#faf5ee',
  pillActiveFg: '#16120f',
  pillIdleBg: '#221c17',
  pillIdleFg: '#ebe3d5',
  pillCountActive: 'rgba(22,18,15,0.55)',
  avatarMonoBg: '#faf5ee',
  avatarMonoFg: '#16120f',
  scrim: '#0d0a08',
  tabActive: '#faf5ee',
  tabInactive: '#6c6259',
};

export type ColorTheme = typeof lightC | typeof darkC;

export const avatarPalettes = {
  light: [
    { bg: '#efe7da', fg: '#2a231e' },
    { bg: '#f3dfd0', fg: '#5a2e16' },
    { bg: '#e6dfd0', fg: '#3b3225' },
    { bg: '#dde4d6', fg: '#2e3a26' },
    { bg: '#d8e0e6', fg: '#22343f' },
    { bg: '#ead6da', fg: '#4a1f2a' },
    { bg: '#e9d9c2', fg: '#5a3c14' },
  ],
  dark: [
    { bg: '#2e2922', fg: '#f3e7d4' },
    { bg: '#382a22', fg: '#f7d8c2' },
    { bg: '#2c2a23', fg: '#ece4d2' },
    { bg: '#272e25', fg: '#d7e8d0' },
    { bg: '#262c34', fg: '#cfdfe9' },
    { bg: '#332328', fg: '#e7c9d0' },
    { bg: '#332a1e', fg: '#eddcb8' },
  ],
};

export function getColors(scheme: string | null | undefined): ColorTheme {
  return scheme === 'dark' ? darkC : lightC;
}

export function avatarTint(name: string, mode: 'light' | 'dark' = 'light') {
  const palettes = avatarPalettes[mode] ?? avatarPalettes.light;
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31 + name.charCodeAt(i)) >>> 0);
  return palettes[h % palettes.length];
}

export function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

// Font family constants
export const F = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
  extrabold: 'Geist_800ExtraBold',
  monoRegular: 'GeistMono_400Regular',
  monoMedium: 'GeistMono_500Medium',
  monoSemibold: 'GeistMono_600SemiBold',
  monoBold: 'GeistMono_700Bold',
} as const;
