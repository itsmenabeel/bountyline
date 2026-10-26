import { Spinner } from "@/components/ui/spinner";

/** Button content while its action runs: a spinner and the action's -ing label. */
export function PendingLabel({ children }: { children: string }) {
  return (
    <>
      <Spinner aria-hidden="true" />
      {children}
    </>
  );
}
