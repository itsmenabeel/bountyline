import type { ApiError } from "@/lib/api/errors";
import { toApiError } from "@/lib/api/errors";
import type { Endpoint } from "@/lib/api/request";
import type { Program, RewardTier } from "@/types/api";
import { programEndpoints } from "./endpoints";
import type { CreateProgramRequest } from "./schemas";

export type CreateStage = "create" | "tiers" | "publish";
export type StageState = "waiting" | "running" | "done" | "failed";
export type StageProgress = Partial<Record<CreateStage, StageState>>;

export interface CreateProgramInput {
  program: CreateProgramRequest;
  tiers: RewardTier[];
  /** Activate after the tiers are saved; otherwise the program stays a draft. */
  publish: boolean;
}

/** A stage failed. `program` is set when the create call had already succeeded. */
export class CreateProgramFailure extends Error {
  constructor(
    readonly stage: CreateStage,
    readonly error: ApiError,
    readonly program: Program | null,
  ) {
    super(error.message);
    this.name = "CreateProgramFailure";
  }
}

type Request = <T>(endpoint: Endpoint<T>) => Promise<T>;

/**
 * The backend creates a program, sets its tiers, and activates it in three calls
 * (design-plan §9.1). This runs them in order, reports each stage's state for the progress
 * list, and stops at the first failure.
 */
export async function createProgram(
  { program, tiers, publish }: CreateProgramInput,
  request: Request,
  onProgress: (progress: StageProgress) => void,
): Promise<Program> {
  const progress: StageProgress = {
    create: "waiting",
    tiers: "waiting",
    ...(publish && { publish: "waiting" }),
  };
  const mark = (stage: CreateStage, state: StageState) => {
    progress[stage] = state;
    onProgress({ ...progress });
  };

  let stage: CreateStage = "create";
  let created: Program | null = null;
  try {
    mark("create", "running");
    created = await request(programEndpoints.create(program));
    mark("create", "done");

    stage = "tiers";
    mark("tiers", "running");
    let result = await request(
      programEndpoints.setRewardTiers(created.id, tiers),
    );
    mark("tiers", "done");

    if (publish) {
      stage = "publish";
      mark("publish", "running");
      result = await request(
        programEndpoints.changeStatus(created.id, "ACTIVE"),
      );
      mark("publish", "done");
    }
    return result;
  } catch (error) {
    mark(stage, "failed");
    throw new CreateProgramFailure(stage, toApiError(error), created);
  }
}
