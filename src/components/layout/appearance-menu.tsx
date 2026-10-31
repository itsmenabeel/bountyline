"use client";

import { Monitor, Moon, Sun, SunMoonIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMounted } from "@/hooks/use-mounted";

const OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

/** The same setting for signed-out visitors, in the public header. The icon doesn't change with
    the theme, because the saved choice is unknown until hydration. */
export function AppearanceMenu() {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const usingPointer = useRef(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          aria-label="Appearance"
          onPointerDown={() => {
            usingPointer.current = true;
          }}
          onKeyDown={() => {
            usingPointer.current = false;
          }}
        >
          <SunMoonIcon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40"
        onKeyDown={() => {
          usingPointer.current = false;
        }}
        // Focus still returns to the button, but only keyboard users get the ring.
        onCloseAutoFocus={(event) => {
          if (!usingPointer.current) return;
          event.preventDefault();
          triggerRef.current?.focus({ focusVisible: false });
        }}
      >
        <AppearanceRadioGroup />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** System, Light, or Dark radio items, shown in the user menu's Appearance submenu. */
export function AppearanceRadioGroup() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <DropdownMenuRadioGroup
      value={mounted ? (theme ?? "system") : ""}
      onValueChange={setTheme}
    >
      {OPTIONS.map((option) => (
        <DropdownMenuRadioItem key={option.value} value={option.value}>
          <option.icon aria-hidden="true" />
          {option.label}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}
