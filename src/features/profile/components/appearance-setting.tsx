"use client";

import { type LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMounted } from "@/hooks/use-mounted";

const OPTIONS: {
  value: "system" | "light" | "dark";
  title: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    value: "system",
    title: "System",
    description: "Follows your device's setting.",
    icon: Monitor,
  },
  {
    value: "light",
    title: "Light",
    description: "Dark text on a light background.",
    icon: Sun,
  },
  {
    value: "dark",
    title: "Dark",
    description: "Light text on a dark background.",
    icon: Moon,
  },
];

/**
 * System, Light, or Dark (design-plan §13), the same setting as the user menu's Appearance
 * submenu. It saves in this browser and applies at once. The saved choice is unknown until
 * hydration, so no option shows as picked before then.
 */
export function AppearanceSetting() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();

  return (
    <FieldSet>
      <FieldLegend variant="label">Appearance</FieldLegend>
      <FieldDescription>
        Saved in this browser. The user menu has the same setting.
      </FieldDescription>
      <RadioGroup
        name="appearance"
        value={mounted ? (theme ?? "system") : ""}
        onValueChange={setTheme}
        className="gap-3 sm:grid-cols-3"
      >
        {OPTIONS.map((option) => (
          <FieldLabel key={option.value} htmlFor={`appearance-${option.value}`}>
            <Field orientation="horizontal">
              <option.icon
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground"
              />
              <FieldContent>
                <FieldTitle>{option.title}</FieldTitle>
                <FieldDescription>{option.description}</FieldDescription>
              </FieldContent>
              <RadioGroupItem
                id={`appearance-${option.value}`}
                value={option.value}
              />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </FieldSet>
  );
}
