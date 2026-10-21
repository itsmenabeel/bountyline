import "server-only";
import { parseServerEnv } from "./schema";

// Importing this from a Client Component fails the build, which keeps secrets off the client.
export const serverEnv = parseServerEnv(process.env);
