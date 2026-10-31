import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "./site";

/** What app/opengraph-image.tsx draws, and the address Next serves it at. */
export const SHARE_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: `${SITE_NAME}: ${SITE_DESCRIPTION}`,
};

/**
 * Title, description, canonical address, and share cards for a public page. Next replaces a
 * parent's `openGraph` and `twitter` objects outright, which also drops the root image file,
 * and doesn't apply the title template inside them. So each page spells out both here.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  /** Leave out for the home page, which uses the site name alone. */
  title?: string;
  description: string;
  path: `/${string}`;
}): Metadata {
  const fullTitle = title ? `${title} · ${SITE_NAME}` : SITE_NAME;
  return {
    ...(title && { title }),
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [SHARE_IMAGE],
    },
  };
}
