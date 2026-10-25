import { CheckIcon, CircleIcon } from "lucide-react";
import { PASSWORD_RULES } from "../schemas";

/**
 * Live checklist for a new password. The field points at it with aria-describedby, so screen
 * readers hear the rules and their state on focus instead of on every keystroke.
 */
export function PasswordRules({ id, value }: { id: string; value: string }) {
  return (
    <ul id={id} className="flex flex-col gap-1 text-sm">
      {PASSWORD_RULES.map((rule) => {
        const met = rule.test(value);
        const Icon = met ? CheckIcon : CircleIcon;
        return (
          <li
            key={rule.id}
            data-met={met}
            className="flex items-center gap-2 text-muted-foreground data-[met=true]:text-foreground"
          >
            <Icon aria-hidden="true" className="size-4 shrink-0" />
            <span>{rule.label}</span>
            <span className="sr-only">{met ? "(done)" : "(not yet)"}</span>
          </li>
        );
      })}
    </ul>
  );
}
