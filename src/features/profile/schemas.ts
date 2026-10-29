import { z } from "zod";
import { nameSchema } from "@/features/auth/schemas";

export const profileSchema = z.object({ name: nameSchema });

export type ProfileValues = z.input<typeof profileSchema>;
export type ProfileInput = z.output<typeof profileSchema>;
