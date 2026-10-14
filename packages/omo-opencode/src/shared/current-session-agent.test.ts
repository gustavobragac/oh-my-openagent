import { describe, expect, it, mock } from "bun:test"

import { getAgentFromSession } from "../hooks/prometheus-md-only/agent-resolution"
import { isCallerOrchestrator } from "./session-utils"

function v2Client(agent: unknown) {
  const messages = mock(async () => {
    throw new Error("tool hooks must not hydrate session history")
  })
  const currentAgent = mock(async () => ({ data: agent }))
  return { client: { session: { messages, currentAgent } } as never, messages, currentAgent }
}

describe("tool hook agent lookups on OpenCode 2", () => {
  it.each([["Atlas - Plan Executor", true], ["Sisyphus - ultraworker", false]])(
    "decides orchestrator ownership for %s from session metadata",
    async (agent, expected) => {
      // given
      const { client, messages, currentAgent } = v2Client(agent)
      // when
      const result = await isCallerOrchestrator("ses_tool_hook", client)
      // then
      expect(result).toBe(expected)
      expect(currentAgent).toHaveBeenCalledWith({ path: { id: "ses_tool_hook" } })
      expect(messages).not.toHaveBeenCalled()
    },
  )

  it("resolves the planning agent from session metadata", async () => {
    // given
    const { client, messages } = v2Client("Prometheus - Plan Builder")
    // when
    const agent = await getAgentFromSession("ses_tool_hook_plan", "/tmp/omo-no-boulder", client)
    // then
    expect(agent).toBe("Prometheus - Plan Builder")
    expect(messages).not.toHaveBeenCalled()
  })

  it("ignores the compaction agent like the history lookup does", async () => {
    // given
    const { client, messages } = v2Client("compaction")
    // when
    const agent = await getAgentFromSession("ses_tool_hook_compaction", "/tmp/omo-no-boulder", client)
    // then
    expect(agent).toBeUndefined()
    expect(messages).not.toHaveBeenCalled()
  })
})
