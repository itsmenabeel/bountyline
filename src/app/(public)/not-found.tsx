import type { Metadata } from "next";
import { NotFoundState } from "@/components/shared/not-found-state";

export const metadata: Metadata = { title: "Page not found" };

/** notFound() on a public page, such as a program that closed or never existed. */
export default function PublicNotFound() {
  return (
    <div className="mx-auto w-full max-w-page px-4 md:px-6 lg:px-8">
      <NotFoundState
        description="The program may have closed, or the link has a typo. Search the open programs instead."
        home={{ href: "/", label: "Go to the home page" }}
        programSearch
      />
    </div>
  );
}
