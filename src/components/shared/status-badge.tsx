import {
  Ban,
  Check,
  CircleCheck,
  CircleDot,
  CircleX,
  Clock,
  Coins,
  Copy,
  Lock,
  type LucideIcon,
  MessageCircleQuestion,
  Pause,
  PencilLine,
  Radio,
  ScanSearch,
  TriangleAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  PAYMENT_STATUS_LABEL,
  PROGRAM_STATUS_LABEL,
  REPORT_STATUS_LABEL,
} from "@/lib/constants/domain";
import { cn } from "@/lib/utils";
import type {
  Cents,
  PaymentStatus,
  ProgramStatus,
  ReportStatus,
} from "@/types/api";
import { Money } from "./money";

// Status stays neutral so color keeps one meaning each: green is money, red is failure, and
// the severity ramp belongs to severity (design-plan §4.1, "Status treatments"). Every status
// has its own icon and word, so none depends on color.

type Tone = "neutral" | "muted" | "money" | "destructive";

const TONE: Record<Tone, string> = {
  neutral: "border-border bg-card text-foreground",
  muted: "border-transparent bg-muted text-muted-foreground",
  money: "border-transparent bg-money-subtle text-money",
  destructive:
    "border-transparent bg-destructive/10 text-destructive dark:bg-destructive/20",
};

interface Treatment {
  icon: LucideIcon;
  tone: Tone;
}

const REPORT: Record<ReportStatus, Treatment> = {
  NEW: { icon: CircleDot, tone: "neutral" },
  TRIAGING: { icon: ScanSearch, tone: "neutral" },
  NEEDS_INFO: { icon: MessageCircleQuestion, tone: "neutral" },
  ACCEPTED: { icon: CircleCheck, tone: "neutral" },
  REWARDED: { icon: Coins, tone: "money" },
  REJECTED: { icon: CircleX, tone: "muted" },
  DUPLICATE: { icon: Copy, tone: "muted" },
};

const PROGRAM: Record<ProgramStatus, Treatment> = {
  DRAFT: { icon: PencilLine, tone: "neutral" },
  ACTIVE: { icon: Radio, tone: "neutral" },
  PAUSED: { icon: Pause, tone: "neutral" },
  CLOSED: { icon: Lock, tone: "neutral" },
};

const PAYMENT: Record<PaymentStatus, Treatment> = {
  PENDING: { icon: Clock, tone: "neutral" },
  SUCCEEDED: { icon: Check, tone: "money" },
  FAILED: { icon: TriangleAlert, tone: "destructive" },
  CANCELLED: { icon: Ban, tone: "muted" },
};

type StatusBadgeProps = { className?: string } & (
  | {
      kind: "report";
      status: ReportStatus /** Shown after "Rewarded". */;
      amount?: Cents;
    }
  | { kind: "program"; status: ProgramStatus }
  | { kind: "payment"; status: PaymentStatus }
);

function treatmentFor(props: StatusBadgeProps): Treatment & { label: string } {
  switch (props.kind) {
    case "report":
      return {
        ...REPORT[props.status],
        label: REPORT_STATUS_LABEL[props.status],
      };
    case "program":
      return {
        ...PROGRAM[props.status],
        label: PROGRAM_STATUS_LABEL[props.status],
      };
    case "payment":
      return {
        ...PAYMENT[props.status],
        label: PAYMENT_STATUS_LABEL[props.status],
      };
  }
}

/** One pill for report, program, and payment statuses. */
export function StatusBadge(props: StatusBadgeProps) {
  const { icon: Icon, tone, label } = treatmentFor(props);
  const amount =
    props.kind === "report" && props.status === "REWARDED"
      ? props.amount
      : undefined;

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 px-2", TONE[tone], props.className)}
    >
      <Icon aria-hidden="true" />
      {label}
      {amount !== undefined && <Money cents={amount} className="ml-0.5" />}
    </Badge>
  );
}
