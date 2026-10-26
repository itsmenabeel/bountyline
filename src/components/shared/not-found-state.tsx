import { SearchIcon, SearchX } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";

/**
 * "We couldn't find that page." (design-plan §7.6) with a way on. Public pages offer a
 * program search, a plain GET form to /programs that works before any JavaScript loads.
 */
export function NotFoundState({
  description,
  home,
  programSearch = false,
}: {
  description: string;
  home: { href: string; label: string };
  programSearch?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-5 py-12">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <SearchX aria-hidden="true" className="size-5" />
      </span>
      <div className="flex max-w-prose flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          We couldn&apos;t find that page.
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {programSearch && (
        // biome-ignore lint/a11y/useSemanticElements: <search> isn't in every browser this site supports yet; role="search" is the documented fallback.
        <form
          action="/programs"
          role="search"
          className="flex w-full max-w-md flex-col gap-1.5"
        >
          <Label htmlFor="not-found-search">Search programs</Label>
          <div className="flex gap-2">
            <InputGroup>
              <InputGroupAddon>
                <SearchIcon aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="not-found-search"
                type="search"
                name="search"
                maxLength={100}
                placeholder="Program name or keyword"
              />
            </InputGroup>
            <Button type="submit" variant="outline">
              Search
            </Button>
          </div>
        </form>
      )}
      <Button asChild size="lg">
        <Link href={home.href}>{home.label}</Link>
      </Button>
    </div>
  );
}
