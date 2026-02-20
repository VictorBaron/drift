import { PROMPT_VERSION } from '@/scoring/domain/prompts/constants';

export const repairJsonOutputPrompt = `
You are a JSON repair assistant.

Task:
Fix the previous assistant output so that it becomes VALID JSON matching the required schema.
Do NOT re-analyze the message. Do NOT change the meaning of fields unless required to satisfy the schema.
If a value is missing or invalid and cannot be repaired without guessing, set it to "unknown", null, false, or an empty array as appropriate, and lower confidence if you change semantics.

Hard rules:
- Output ONLY the repaired JSON.
- No markdown, no commentary.
- The JSON must match the schema exactly (no extra keys).

Schema constraints (summary):
- version must be "${PROMPT_VERSION}"
- deadlineAtIso must be ISO datetime string or null
- confidence must be between 0 and 1
- enums must be one of the allowed values
- all required keys must be present
- rationale is an array of strings (max 8)

Here is the original INPUT_JSON (for reference only; do not re-analyze):
{{INPUT_JSON}}

Here is the invalid assistant output:
{{MODEL_OUTPUT}}

Here are the validation errors:
{{ZOD_ERROR_SUMMARY}}

Now produce the repaired JSON only.
`;
