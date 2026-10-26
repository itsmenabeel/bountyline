"use client";

import { BarChart3, Table2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { chartHeight } from "../chart-size";
import type { ChartRow } from "../stats";

// Recharts only runs in the browser and is the heaviest thing on this page, so each chart
// loads after the titles and summaries, which render on the server.
const BarChartView = dynamic(
  () => import("./bar-chart-view").then((module) => module.BarChartView),
  { ssr: false, loading: () => <Skeleton className="absolute inset-0" /> },
);

/**
 * One chart with its one-line summary, a table twin, and an empty state when every value is
 * 0 (design-plan §10). The table is the accessible equivalent, so the toggle never gates a
 * number behind a hover.
 */
export function ChartCard({
  title,
  summary,
  rows,
  orientation,
  format,
  categoryHeader,
  valueHeader,
}: {
  title: string;
  summary: string;
  rows: ChartRow[];
  orientation: "horizontal" | "vertical";
  format: (value: number) => string;
  /** Column headers for the table view. */
  categoryHeader: string;
  valueHeader: string;
}) {
  const [asTable, setAsTable] = useState(false);
  const headingId = useId();
  const empty = rows.every((row) => row.value === 0);

  return (
    <section
      aria-labelledby={headingId}
      className="flex min-w-0 flex-col gap-4 rounded-xl border bg-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 id={headingId} className="text-base font-semibold">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{summary}</p>
        </div>
        {!empty && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAsTable((value) => !value)}
            aria-pressed={asTable}
            className="shrink-0"
          >
            {asTable ? (
              <BarChart3 aria-hidden="true" />
            ) : (
              <Table2 aria-hidden="true" />
            )}
            {asTable ? "View as chart" : "View as table"}
          </Button>
        )}
      </div>

      {empty ? (
        <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
          Nothing to chart yet. The bars appear once there&apos;s data.
        </p>
      ) : asTable ? (
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th scope="col" className="py-2 font-medium">
                {categoryHeader}
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                {valueHeader}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((row) => (
              <tr key={row.key}>
                <th scope="row" className="py-2 text-left font-normal">
                  {row.label}
                </th>
                <td className="py-2 text-right tabular-nums">
                  {format(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        // The placeholder holds the chart's exact height until Recharts loads.
        <div
          className="relative"
          style={{ minHeight: chartHeight(rows.length, orientation) }}
        >
          <BarChartView
            rows={rows}
            orientation={orientation}
            format={format}
            title={title}
          />
        </div>
      )}
    </section>
  );
}
