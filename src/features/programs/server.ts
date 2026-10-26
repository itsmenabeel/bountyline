import "server-only";
import { notFound } from "next/navigation";
import { cache } from "react";
import { serverRequest } from "@/lib/api/server";
import { isUuid } from "@/lib/ids";
import { programEndpoints } from "./endpoints";

/**
 * One program for a signed-in page, read once per request (the page and its metadata both
 * ask). A malformed id renders not-found here; the backend would answer it with a 422.
 */
export const getProgram = cache(async (id: string) => {
  if (!isUuid(id)) notFound();
  return serverRequest(programEndpoints.detail(id));
});
