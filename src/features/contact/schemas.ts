import { z } from "zod";
import { emailSchema, nameSchema } from "@/features/auth/schemas";

// implementation-plan §4.8, "Contact": name 2–100, email, topic, message 20–5,000.

export const CONTACT_TOPICS = [
  "program",
  "report",
  "payment",
  "account",
  "other",
] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const CONTACT_TOPIC_LABEL: Record<ContactTopic, string> = {
  program: "Running a program",
  report: "A report I submitted",
  payment: "A payment or payout",
  account: "My account",
  other: "Something else",
};

export const MESSAGE = { min: 20, max: 5000 } as const;

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  topic: z.enum(CONTACT_TOPICS, "Pick a topic."),
  message: z
    .string()
    .trim()
    .min(1, { error: "Write your message.", abort: true })
    .min(MESSAGE.min, `Write at least ${MESSAGE.min} characters.`)
    .max(
      MESSAGE.max,
      `Keep it to ${MESSAGE.max.toLocaleString("en-US")} characters.`,
    ),
});

export type ContactValues = z.input<typeof contactSchema>;
export type ContactInput = z.output<typeof contactSchema>;

/**
 * The `mailto:` link that opens the visitor's mail app with the message filled in
 * (implementation-plan §4.12). The sender's name and email go in the body, since the mail
 * app sends from whatever account it holds.
 */
export function contactMailto(to: string, values: ContactInput) {
  const subject = `[Bountyline] ${CONTACT_TOPIC_LABEL[values.topic]}`;
  const body = `${values.message}\n\n${values.name}\n${values.email}`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
