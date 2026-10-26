// Shared by the chart and its loading placeholder, so the card keeps its height when
// Recharts arrives (design-plan §9.4). Kept apart from bar-chart-view.tsx so importing it
// doesn't pull Recharts into the first load.

const ROW_HEIGHT = 36;
const COLUMN_CHART_HEIGHT = 240;

export function chartHeight(
  rowCount: number,
  orientation: "horizontal" | "vertical",
) {
  return orientation === "horizontal"
    ? rowCount * ROW_HEIGHT + 16
    : COLUMN_CHART_HEIGHT;
}
