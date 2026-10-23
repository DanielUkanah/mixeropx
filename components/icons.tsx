const paths: Record<string, string> = {
  overview: "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9",
  invoices: "M7 3.5h7.5L18.5 8v12.5H7zM14.5 3.5V8h4M10 12.5h5M10 16h5",
  expenses: "M4 7.5h16v11H4zM4 7.5 6.5 4h11L20 7.5M15 13h2.5",
  reports: "M5 20V11M12 20V5M19 20v-7",
  settings: "M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4",
  plus: "M12 5v14M5 12h14",
  left: "M14.5 6 8.5 12l6 6",
  right: "M9.5 6l6 6-6 6",
  drum: "M3 17.5h3.5M6.5 17.5l1.5-7 6-1.5 3 3.5v5M8 10.5 7 7.5h4l3 1.5M19 15.5h2",
  arrowUp: "M12 19V5M6 11l6-6 6 6",
  arrowDown: "M12 5v14M6 13l6 6 6-6",
  fuel: "M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20M4 20h11M14 9h2.5a1.5 1.5 0 0 1 1.5 1.5V16a1.5 1.5 0 0 0 3 0V9l-2.5-2.5M7.5 8h4",
  wrench: "M15.5 4.5a4 4 0 0 0-4.7 5.2L4.5 16a1.8 1.8 0 0 0 2.5 2.5l6.3-6.3a4 4 0 0 0 5.2-4.7l-2.4 2.4-2.1-.6-.6-2.1z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0",
  box: "M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8",
  drop: "M12 4c3 4 5.5 6.8 5.5 10a5.5 5.5 0 0 1-11 0C6.5 10.8 9 8 12 4z",
  flag: "M6 20V4M6 5h11l-2 4 2 4H6",
  shield: "M12 4l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7z",
  briefcase: "M4 8h16v11H4zM9 8V5.5h6V8M4 13h16",
  dots: "M5.5 12h1M11.5 12h1M17.5 12h1",
  paperclip: "M18.5 11.5l-6.4 6.4a4.2 4.2 0 0 1-6-6l7-7a2.8 2.8 0 0 1 4 4l-7 7a1.4 1.4 0 0 1-2-2l6.3-6.3",
  download: "M12 4v11M7 11l5 5 5-5M5 20h14",
  refresh: "M20 11a8 8 0 0 0-14-4.5L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4.5L20 15M20 20v-5h-5",
  alert: "M12 8v5M12 16.5h.01M10.3 4.5L3.5 17a2 2 0 0 0 1.7 3h13.6a2 2 0 0 0 1.7-3L13.7 4.5a2 2 0 0 0-3.4 0z",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z",
  printer: "M7 9V4h10v5M7 17H5v-6h14v6h-2M7 14h10v6H7z",
};
export default function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}
