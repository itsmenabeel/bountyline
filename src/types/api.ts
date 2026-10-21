// Response shapes of the bug-bounty-platform API, taken from the backend's *.select.ts files
// and service return values. Money is always integer cents. Dates are ISO 8601 strings.

export type IsoDateString = string;
export type Cents = number;

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export const ROLES = ["RESEARCHER", "PROGRAM_OWNER", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const PROGRAM_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "CLOSED",
] as const;
export type ProgramStatus = (typeof PROGRAM_STATUSES)[number];

export const SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
export type Severity = (typeof SEVERITIES)[number];

export const REPORT_STATUSES = [
  "NEW",
  "TRIAGING",
  "NEEDS_INFO",
  "ACCEPTED",
  "DUPLICATE",
  "REJECTED",
  "REWARDED",
] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "PENDING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PayoutStatus = "PENDING" | "PAID";

// ---- Users and auth ----

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  reputation: number;
  walletBalance: Cents;
  isActive: boolean;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** POST /auth/login, /auth/register, /auth/google */
export interface AuthResult extends TokenPair {
  user: User;
}

/** PATCH /admin/users/:id/status */
export interface UserStatusResult extends User {
  pausedPrograms: number;
}

// ---- Programs ----

export interface ProgramScope {
  inScope: string[];
  outOfScope: string[];
  rules?: string;
}

export interface RewardTier {
  severity: Severity;
  amount: Cents;
}

export interface Program {
  id: string;
  ownerId: string;
  owner: { name: string };
  title: string;
  description: string;
  scope: ProgramScope;
  status: ProgramStatus;
  poolBalance: Cents;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  /** Sorted by amount, lowest first. */
  rewardTiers: RewardTier[];
}

// ---- Reports and comments ----

export interface Report {
  id: string;
  programId: string;
  researcherId: string;
  title: string;
  /** Markdown written by the researcher. */
  description: string;
  severity: Severity | null;
  status: ReportStatus;
  duplicateOfId: string | null;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  program: { id: string; title: string };
  researcher: { id: string; name: string; reputation: number };
}

export interface ReportComment {
  id: string;
  reportId: string;
  body: string;
  createdAt: IsoDateString;
  author: { id: string; name: string; role: Role };
}

// ---- Money ----

export interface Payment {
  id: string;
  programId: string;
  amount: Cents;
  currency: string;
  provider: string;
  status: PaymentStatus;
  stripeSessionId: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  program: { id: string; title: string };
}

/** POST /payments/checkout */
export interface CheckoutResult {
  payment: Pick<Payment, "id" | "programId" | "amount" | "currency" | "status">;
  checkoutUrl: string;
}

export interface Payout {
  id: string;
  amount: Cents;
  status: PayoutStatus;
  createdAt: IsoDateString;
  report: { id: string; title: string };
  program: { id: string; title: string };
  researcher: { id: string; name: string };
}

/** POST /reports/:id/reward */
export interface RewardResult {
  payout: {
    id: string;
    reportId: string;
    amount: Cents;
    status: PayoutStatus;
    createdAt: IsoDateString;
  };
  program: { id: string; poolBalance: Cents };
  researcher: { id: string; walletBalance: Cents; reputation: number };
  report: { id: string; status: "REWARDED" };
}

// ---- Admin ----

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: JsonValue | null;
  createdAt: IsoDateString;
  actor: { id: string; name: string; role: Role };
}

export interface DashboardStats {
  users: { total: number; banned: number; byRole: Record<Role, number> };
  programs: {
    total: number;
    byStatus: Record<ProgramStatus, number>;
    totalPoolBalance: Cents;
  };
  reports: {
    total: number;
    byStatus: Record<ReportStatus, number>;
    /** Triaged reports only; untriaged ones have no severity yet. */
    bySeverity: Record<Severity, number>;
    createdLast7Days: number;
  };
  money: {
    totalFunded: Cents;
    totalPaidOut: Cents;
    payoutCount: number;
    pendingPayments: number;
  };
}

// ---- Public (no auth) ----

/** GET /public/stats */
export interface PublicStats {
  activePrograms: number;
  availableInPools: Cents;
  totalPaidOut: Cents;
  payoutCount: number;
  reportsResolved: number;
  researchers: number;
  generatedAt: IsoDateString;
}
