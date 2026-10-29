// Plain module (no "use client"): the server page reads these too, and a value exported
// from a client module reaches server code as a client reference, not the value.

export const OWNER_PROGRAM_TABS = ["overview", "payments", "settings"] as const;
export type OwnerProgramTab = (typeof OWNER_PROGRAM_TABS)[number];

export const isOwnerProgramTab = (value: unknown): value is OwnerProgramTab =>
  (OWNER_PROGRAM_TABS as readonly unknown[]).includes(value);
