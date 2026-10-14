import { normalizeSDKResponse } from "./normalize-sdk-response"

type CurrentAgentClient = {
  readonly session: {
    readonly currentAgent: (input: { readonly path: { readonly id: string } }) => Promise<unknown>
  }
}

/**
 * - `agent`: the session's configured agent (OpenCode 2 `Session.Info.agent`).
 * - `default`: OpenCode 2 session without a configured agent. Agents only change through
 *   switchAgent, which records one, so every turn ran the default agent and history adds nothing.
 * - `unknown`: OpenCode 1 client or metadata unavailable; callers fall back to message history.
 */
export type CurrentSessionAgent =
  | { readonly kind: "agent"; readonly name: string }
  | { readonly kind: "default" }
  | { readonly kind: "unknown" }

function hasCurrentAgent(client: unknown): client is CurrentAgentClient {
  if (typeof client !== "object" || client === null || !("session" in client)) return false
  const session = client.session
  return typeof session === "object" && session !== null && "currentAgent" in session && typeof session.currentAgent === "function"
}

/** Reads the agent without the session history, whose decode revalidates every stored attachment. */
export async function readCurrentSessionAgent(client: unknown, sessionID: string): Promise<CurrentSessionAgent> {
  if (!hasCurrentAgent(client)) return { kind: "unknown" }
  try {
    const agent = normalizeSDKResponse<unknown>(await client.session.currentAgent({ path: { id: sessionID } }), null)
    return typeof agent === "string" && agent.trim().length > 0 ? { kind: "agent", name: agent } : { kind: "default" }
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return { kind: "unknown" }
  }
}
