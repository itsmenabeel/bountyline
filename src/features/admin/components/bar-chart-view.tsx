"use client";

import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Rectangle,
  type RectangleProps,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { chartHeight } from "../chart-size";
import type { ChartRow } from "../stats";

// Mark specs from the dataviz skill: bars at most 24px thick with a 4px rounded data end
// and a square baseline, values at the bar tip in text ink (never the bar color), no
// gridlines or value axis because every bar carries its value, and a tooltip on hover and
// on keyboard focus (Recharts' accessibility layer: Tab to the chart, then the arrow keys).

const BAR_SIZE = 20;

function Tip({
  active,
  payload,
  format,
}: Pick<TooltipContentProps<number, string>, "active" | "payload"> & {
  format: (value: number) => string;
}) {
  const row = payload?.[0]?.payload as ChartRow | undefined;
  if (!active || !row) return null;
  // Values lead, labels follow: the reader already knows the bar and wants the number.
  return (
    <div className="rounded-lg border bg-popover px-2.5 py-1.5 text-xs shadow-(--overlay-shadow)">
      <div className="font-semibold text-popover-foreground tabular-nums">
        {format(row.value)}
      </div>
      <div className="text-muted-foreground">{row.label}</div>
    </div>
  );
}

const LABEL_OFFSET = 8;

/** The value at the bar tip, in text ink. A 0 reads as 0, not as a missing row. */
function ValueLabel({
  x,
  y,
  width,
  height,
  value,
  horizontal,
  format,
}: {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  height?: number | string;
  value?: unknown;
  horizontal: boolean;
  format: (value: number) => string;
}) {
  const left = Number(x);
  const top = Number(y);
  const w = Number(width);
  const h = Number(height);
  if (typeof value !== "number" || [left, top, w, h].some(Number.isNaN)) {
    return null;
  }
  return (
    <text
      x={horizontal ? left + w + LABEL_OFFSET : left + w / 2}
      y={horizontal ? top + h / 2 : top - LABEL_OFFSET}
      textAnchor={horizontal ? "start" : "middle"}
      dominantBaseline={horizontal ? "central" : "auto"}
      className="fill-foreground text-xs tabular-nums"
    >
      {format(value)}
    </text>
  );
}

export function BarChartView({
  rows,
  orientation,
  format,
  title,
}: {
  rows: ChartRow[];
  /** "horizontal" bars grow left to right; "vertical" columns grow upward. */
  orientation: "horizontal" | "vertical";
  format: (value: number) => string;
  /** The chart's name, for the config's label. */
  title: string;
}) {
  const horizontal = orientation === "horizontal";
  const height = chartHeight(rows.length, orientation);

  return (
    <ChartContainer
      config={{ value: { label: title } }}
      className="aspect-auto w-full [&_.recharts-surface:focus-visible]:rounded-md [&_.recharts-surface:focus-visible]:outline-3 [&_.recharts-surface:focus-visible]:outline-ring/70"
      style={{ height }}
    >
      <BarChart
        data={rows}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={
          horizontal
            ? { top: 4, right: 72, bottom: 4, left: 4 }
            : { top: 24, right: 8, bottom: 4, left: 8 }
        }
        barCategoryGap={horizontal ? 8 : "24%"}
      >
        {horizontal ? (
          <>
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="label"
              width={104}
              tickLine={false}
              axisLine={false}
            />
          </>
        ) : (
          <>
            <XAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis type="number" hide domain={[0, "dataMax"]} />
          </>
        )}
        <ChartTooltip
          cursor={false}
          content={(props) => (
            <Tip
              active={props.active}
              payload={props.payload}
              format={format}
            />
          )}
        />
        <Bar
          dataKey="value"
          barSize={BAR_SIZE}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          isAnimationActive={false}
          // A custom shape keeps 0-length bars in the layout (Recharts drops them otherwise),
          // so their "0" label still draws; the rectangle itself paints nothing at length 0.
          shape={(props: RectangleProps) => <Rectangle {...props} />}
        >
          {rows.map((row) => (
            <Cell key={row.key} fill={row.color} />
          ))}
          <LabelList
            dataKey="value"
            content={(props) => (
              <ValueLabel {...props} horizontal={horizontal} format={format} />
            )}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
