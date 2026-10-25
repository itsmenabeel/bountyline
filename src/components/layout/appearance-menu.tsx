"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { useMounted } from "@/hooks/use-mounted";

const OPTIONS = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

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
