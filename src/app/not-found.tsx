import type { Metadata } from "next";
import { Logo } from "@/components/brand/logo";
import { NotFoundState } from "@/components/shared/not-found-state";

export const metadata: Metadata = { title: "Page not found" };

/**
 * Any address no route matches. It renders in the root layout alone, without a section's
 * header, so it brings the logo and its own main landmark.
 */
export default function NotFound() {
  return (
    <>
      <header className="mx-auto w-full max-w-page px-4 py-5 md:px-6 lg:px-8">
        <Logo />
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-page flex-1 px-4 outline-none md:px-6 lg:px-8"
      >
        <NotFoundState
          description="The address may have a typo, or the page has moved. Search the open programs, or start from the home page."
          home={{ href: "/", label: "Go to the home page" }}
          programSearch
        />
      </main>
    </>
  );
}
