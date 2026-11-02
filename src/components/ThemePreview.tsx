import React from "react";

type ThemePreviewName = "light" | "dark";

interface ThemePreviewProps {
  theme: ThemePreviewName;
  selected: boolean;
  onSelect: () => void;
}

const palettes = {
  light: {
    background: "#FFF8F2",
    surface: "#FFFDFB",
    primary: "#261810",
    secondary: "#78564F",
    border: "#78564F",
    surfaceBorder: "#D2C3BE",
    blush: "#FDD0C6",
    terracotta: "#D47A55",
    selectedBorder: "#A65335",
    title: "Daylight",
    description: "Warm cream & espresso",
  },
  dark: {
    background: "#1A1614",
    surface: "#24201D",
    primary: "#F4EFEA",
    secondary: "#A99A8F",
    border: "#A99A8F",
    surfaceBorder: "#453A34",
    blush: "#FDD0C6",
    terracotta: "#D47A55",
    selectedBorder: "#D47A55",
    title: "Charcoal Night",
    description: "Espresso charcoal",
  },
} as const;

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, selected, onSelect }) => {
  const palette = palettes[theme];

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="min-h-11 w-full rounded-xl p-3 text-left focus-visible:outline"
      style={{
        color: palette.primary,
        backgroundColor: palette.background,
        border: `${selected ? 2 : 1}px solid ${selected ? palette.selectedBorder : palette.border}`,
        fontFamily: '"Nunito Sans", sans-serif',
      }}
    >
      <span className="block text-xs font-bold">{palette.title}</span>
      <span className="block text-[11px]" style={{ color: palette.secondary }}>
        {palette.description}
      </span>
      <span
        aria-hidden="true"
        className="mt-2 flex items-center justify-between rounded-lg border px-2.5 py-2"
        style={{
          color: palette.primary,
          backgroundColor: palette.surface,
          borderColor: palette.surfaceBorder,
        }}
      >
        <span className="text-[11px] font-bold">Aa</span>
        <span className="flex gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.blush }} />
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: palette.terracotta }} />
        </span>
      </span>
    </button>
  );
};

export default ThemePreview;
