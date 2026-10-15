import { z } from "zod";
import { FINAL_COUNT, MAX_ANSWER_LENGTH, ROUND_COUNT } from "./types";

export const SubmitSchema = z.object({
  eventId: z.uuid(),
  deviceId: z.uuid(),
  role: z.enum(["wife", "husband"]),
  answers: z
    .array(z.object({ questionId: z.uuid(), text: z.string().max(MAX_ANSWER_LENGTH * 2) }))
    .max(100),
});

export const LoginSchema = z.object({ pin: z.string().min(1).max(64) });

export const SurveyOpenSchema = z.object({ open: z.boolean() });

const QuestionText = z.string().trim().min(1).max(200);
const AudienceEnum = z.enum(["all", "wife", "husband"]);

export const NewQuestionSchema = z.object({ text: QuestionText, audience: AudienceEnum });

export const QuestionPatchSchema = z
  .object({ text: QuestionText.optional(), audience: AudienceEnum.optional(), hidden: z.boolean().optional() })
  .refine((p) => Object.keys(p).length > 0);

export const ReorderSchema = z.object({ ids: z.array(z.uuid()).min(1).max(500) });

export const GroupModeSchema = z.object({ mode: z.enum(["basic", "ai"]) });

const Label = z.string().trim().min(1).max(60);

export const GroupOpSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("move"), normalized: z.string().min(1), groupId: z.uuid() }),
  z.object({ op: z.literal("moveNew"), normalized: z.string().min(1), label: Label }),
  z.object({ op: z.literal("merge"), from: z.uuid(), into: z.uuid() }),
  z.object({ op: z.literal("rename"), groupId: z.uuid(), label: Label }),
  z.object({ op: z.literal("hide"), groupId: z.uuid(), hidden: z.boolean() }),
]);

const Slot = z.uuid().nullable();
export const PlanSchema = z.object({
  rounds: z.array(Slot).length(ROUND_COUNT),
  final: z.array(Slot).length(FINAL_COUNT),
});
