// Small stroke icons for the simulated shell. One path string per icon keeps the bundle light.
const PATHS = {
  search: "M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.3-4.3",
  bell: "M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Zm4 11.5a2.2 2.2 0 0 0 4 0",
  plus: "M12 5v14M5 12h14",
  chevronDown: "m6 9 6 6 6-6",
  chevronRight: "m9 6 6 6-6 6",
  chevronLeft: "m15 6-6 6 6 6",
  close: "M6 6l12 12M18 6 6 18",
  check: "m5 12.5 4.5 4.5L19 7.5",
  contacts: "M16 19v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V19M9.5 9.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm11.5 9.5v-1.5a4 4 0 0 0-3-3.85M15.5 2.65a3.5 3.5 0 0 1 0 6.7",
  company: "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M2 21h20M8 7h4M8 11h4M8 15h4",
  deal: "M3 8.5 12 3l9 5.5M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18",
  inbox: "M3 13h5l1.5 3h5L16 13h5M5.5 5h13L21 13v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5l2.5-8Z",
  task: "M9 6h11M9 12h11M9 18h11M4 6l.8.8L6.5 5M4 12l.8.8 1.7-1.8M4 18l.8.8 1.7-1.8",
  product: "m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12v9M12 12 4 7.5",
  target: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-4a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z",
  quote: "M7 3h8l4 4v14H7V3Zm8 0v4h4M10 12h6M10 16h6",
  workflow: "M5 3h6v5H5V3Zm8 13h6v5h-6v-5ZM8 8v4a2 2 0 0 0 2 2h4a2 2 0 0 1 2 2",
  note: "M5 4h14v11l-5 5H5V4Zm9 16v-5h5",
  email: "M3 6h18v12H3V6Zm0 1 9 6.5L21 7",
  call: "M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
  meeting: "M4 6h16v14H4V6Zm0 4h16M8 3v4M16 3v4",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  form: "M5 4h14v16H5V4Zm3 4h8M8 12h8M8 16h4",
  sync: "M4 12a8 8 0 0 1 14-5.3L20 9M20 4v5h-5M20 12a8 8 0 0 1-14 5.3L4 15M4 20v-5h5",
  lifecycle: "M4 18 9 12l4 3 7-9M15 6h5v5",
  lock: "M6 11h12v9H6v-9Zm2.5 0V7.5a3.5 3.5 0 0 1 7 0V11",
  unlock: "M6 11h12v9H6v-9Zm2.5 0V7.5a3.5 3.5 0 0 1 6.8-1.2",
  external: "M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5",
  paperclip: "m20 11-8.5 8.5a5 5 0 0 1-7-7L13 4a3.3 3.3 0 0 1 4.7 4.7L9.4 17a1.7 1.7 0 0 1-2.4-2.4L14.5 7",
  filter: "M4 5h16l-6 7.5V19l-4 1.5v-8L4 5Z",
  board: "M4 4h6v16H4V4Zm10 0h6v10h-6V4Z",
  list: "M4 6h16M4 12h16M4 18h16",
  sort: "m8 9 4-4 4 4M8 15l4 4 4-4",
  refresh: "M20 11a8 8 0 1 0-2.3 6.3M20 5v6h-6",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8.5a7.5 7.5 0 0 1 15 0",
  home: "M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z",
  pin: "M9 4h6l-1 6 3 3H7l3-3-1-6Zm3 9v7",
  warning: "M12 4 2.5 20h19L12 4Zm0 6v5m0 2.5v.01",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v6m0-9v.01",
  send: "M4 12 20 4l-5 16-3.5-6.5L4 12Zm7.5 1.5L20 4",
  slack: "M9 3v12M15 9v12M3 9h12M9 15h12",
  truck: "M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7.5 19a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Zm9.5 0a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z",
  arrowRight: "M5 12h14m-6-6 6 6-6 6",
  arrowLeft: "M19 12H5m6-6-6 6 6 6",
  reset: "M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5",
  highlight: "m12 3 2.2 5.6L20 9.3l-4.4 4 1.3 5.9L12 16.2l-4.9 3 1.3-5.9-4.4-4 5.8-.7L12 3Z",
  layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9.5 9 5 9-5",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm10-14 4 4",
  file: "M7 3h7l5 5v13H7V3Zm7 0v5h5",
  globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.500 5.6 12 3Z",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.5-3 1.800 1.400-2 3.400-2.100-.800-1.700 1-.400 2.200h-4l-.300-2.200-1.800-1-2.100.800-2-3.400L4.600 12 2.800 10.600l2-3.400 2.100.800 1.700-1L9 4.800h4l.300 2.200 1.800 1 2.100-.800 2 3.400L19.500 12Z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 16, className, strokeWidth = 1.7 }: { name: IconName; size?: number; className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The Breeze sparkle: two four-point stars. */
export function Sparkle({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" className={className} aria-hidden="true">
      <path d="M10 3c.6 4.300 2.700 6.400 7 7-4.300.600-6.400 2.700-7 7-.600-4.300-2.700-6.400-7-7 4.300-.600 6.400-2.700 7-7Zm8.500 10.500c.300 2.100 1.400 3.200 3.500 3.500-2.100.300-3.200 1.400-3.500 3.500-.300-2.100-1.400-3.200-3.500-3.500 2.100-.300 3.200-1.400 3.500-3.500Z" />
    </svg>
  );
}
