"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

const subscribe = () => () => {};

/** True after hydration. The saved theme is unknown on the server, so the choice renders after mount. */
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** System, Light, or Dark radio items; reused in the user menu once sessions exist. */
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

export function AppearanceMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Appearance">
          {/* CSS picks the icon, so it matches the theme before hydration. */}
          <Sun aria-hidden="true" className="dark:hidden" />
          <Moon aria-hidden="true" className="hidden dark:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <AppearanceRadioGroup />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
