import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { programEndpoints } from "@/features/programs/endpoints";
import { publicRequest } from "@/lib/api/public";
import { publicEnv } from "@/lib/env/public";
import type { Program } from "@/types/api";

const PUBLIC_PATHS = [
  "/",
  "/programs",
  "/how-it-works",
  "/about",
  "/faq",
  "/contact",
];

/** Every ACTIVE program, one backend page (50, its maximum) at a time. */
async function activePrograms() {
  const programs: Program[] = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const { items, meta } = await publicRequest(
      programEndpoints.publicList({
        page,
        limit: 50,
        sortBy: "createdAt",
        order: "desc",
      }),
    );
    programs.push(...items);
    totalPages = meta.totalPages;
    page += 1;
  }
  return programs;
}

/**
 * Public pages and active programs. Built per request, so `next build` never calls the API;
 * each backend read is cached for a minute. A failed read still lists the public pages.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const site = publicEnv.NEXT_PUBLIC_SITE_URL;

  let programs: Program[] = [];
  try {
    programs = await activePrograms();
  } catch {
    programs = [];
  }

  return [
    ...PUBLIC_PATHS.map((path) => ({
      url: path === "/" ? site : `${site}${path}`,
    })),
    ...programs.map((program) => ({
      url: `${site}/programs/${program.id}`,
      lastModified: program.updatedAt,
    })),
  ];
}
