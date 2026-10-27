import type { FieldErrors, FieldValues } from "react-hook-form";

/** Joins the ids that describe a field, skipping the ones that don't apply right now. */
export const describedBy = (...ids: (string | false | undefined)[]) =>
  ids.filter(Boolean).join(" ") || undefined;

export interface FlatFieldError {
  /** Dotted path, e.g. "inScope.2.value", or "inScope.root" for the list itself. */
  path: string;
  message: string;
}

/** RHF's nested errors as a flat list in field order, for an error summary. */
export function flattenFieldErrors<T extends FieldValues>(
  errors: FieldErrors<T>,
): FlatFieldError[] {
  const flat: FlatFieldError[] = [];
  const walk = (node: unknown, path: string) => {
    if (typeof node !== "object" || node === null) return;
    if ("message" in node && typeof node.message === "string") {
      flat.push({ path, message: node.message });
    }
    for (const [key, child] of Object.entries(node)) {
      // `ref` points at the DOM element; `message` and `type` are the error itself.
      if (key === "ref" || key === "message" || key === "type") continue;
      walk(child, path ? `${path}.${key}` : key);
    }
  };
  walk(errors, "");
  return flat;
}
