/** The researcher's report wizard, opened on one program (design-plan §9.1). */
export function newReportHref(programId: string) {
  return `/researcher/reports/new?programId=${encodeURIComponent(programId)}`;
}
