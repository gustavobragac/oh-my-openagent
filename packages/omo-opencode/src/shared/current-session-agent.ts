import { normalizeSDKResponse } from "./normalize-sdk-response"

type CurrentAgentClient = {
  readonly session: {
    readonly currentAgent: (input: { readonly path: { readonly id: string } }) => Promise<unknown>
  }
}

function hasCurrentAgent(client: unknown): client is CurrentAgentClient {
  if (typeof client !== "object" || client === null || !("session" in client)) return false
  const session = client.session
  return typeof session === "object" && session !== null && "currentAgent" in session && typeof session.currentAgent === "function"
}

/**
 * The session's configured agent from OpenCode 2 session metadata. Undefined when the client
 * lacks the capability (OpenCode 1) or the metadata is unavailable, so callers can fall back to
 * message history. Reading history on OpenCode 2 decodes every stored attachment.
 */
export async function readCurrentSessionAgent(client: unknown, sessionID: string): Promise<string | undefined> {
  if (!hasCurrentAgent(client)) return undefined
  try {
    const agent = normalizeSDKResponse<unknown>(await client.session.currentAgent({ path: { id: sessionID } }), null)
    return typeof agent === "string" && agent.trim().length > 0 ? agent : undefined
  } catch (error) {
    if (!(error instanceof Error)) throw error
    return undefined
  }
}
