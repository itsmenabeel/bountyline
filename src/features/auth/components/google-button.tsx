"use client";

import { GoogleLogin } from "@react-oauth/google";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { ColdStartHint } from "@/components/shared/cold-start-hint";
import { Spinner } from "@/components/ui/spinner";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

/** Shown when Google's popup reports an error instead of returning a token. */
export const GOOGLE_POPUP_FAILED =
  "Google sign-in didn't finish. Try again, or use your email and password.";

// Google renders the button in an iframe at a fixed pixel width between these limits.
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

/** The container's width, clamped to what Google's button accepts. 0 until measured. */
function useButtonWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;
      const available = Math.floor(entry.contentRect.width);
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, available)));
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/**
 * Google's own sign-in button (official artwork, design-plan §7.2): outline in light mode,
 * filled black in dark. A popup returns an ID token; the parent sends it to `googleLogin`.
 * `disabled` makes it inert and dims it, since Google's button has no disabled state.
 * While `pending`, a status line under it takes the place of a spinner.
 */
export function GoogleButton({
  text,
  pending = false,
  disabled = false,
  onCredential,
  onError,
}: {
  text: "signin_with" | "signup_with" | "continue_with";
  pending?: boolean;
  disabled?: boolean;
  onCredential: (idToken: string) => void;
  onError: () => void;
}) {
  const inactive = disabled || pending;
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const [ref, width] = useButtonWidth();
  const theme = resolvedTheme === "dark" ? "filled_black" : "outline";

  return (
    <div className="flex flex-col">
      <div
        ref={ref}
        inert={inactive}
        data-disabled={inactive || undefined}
        // Reserves the button's 40px height so nothing moves when Google's script arrives.
        className={cn(
          "flex h-10 w-full justify-center transition-opacity duration-(--motion-fast)",
          inactive && "opacity-50",
        )}
      >
        {mounted && width > 0 ? (
          <GoogleLogin
            key={`${theme}-${text}`}
            theme={theme}
            text={text}
            size="large"
            shape="rectangular"
            logo_alignment="center"
            width={width}
            onSuccess={({ credential }) =>
              credential ? onCredential(credential) : onError()
            }
            onError={onError}
          />
        ) : null}
      </div>
      <p
        aria-live="polite"
        className="flex items-center justify-center gap-2 pt-2 text-sm text-muted-foreground empty:pt-0"
      >
        {pending ? (
          <>
            <Spinner aria-hidden="true" />
            Signing in with Google…
          </>
        ) : null}
      </p>
      <ColdStartHint pending={pending} className="text-center" />
    </div>
  );
}
