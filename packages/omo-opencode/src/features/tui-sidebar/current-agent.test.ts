import { afterEach, describe, expect, it, mock } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { buildTuiRuntimeSnapshot } from "./snapshot-builder"

const directories: string[] = []

afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function projectDir(): string {
  const directory = mkdtempSync(join(tmpdir(), "omo-sidebar-agent-metadata-"))
  directories.push(directory)
  return directory
}

function historicalMessages() {
  return { data: [{ info: { agent: "historical-agent", time: { created: 1 } }, parts: [{ data: "QUFB".repeat(262144) }] }] }
}

describe("sidebar current agent metadata", () => {
  it.each(["ATLAS", "Hephaestus"])("shows the current agent %s rather than hydrating image history", async (agent) => {
    // given
    const messages = mock(async () => historicalMessages())
    const input = {
      projectDir: projectDir(),
      backgroundManager: { getTasksSnapshot: () => [] },
      client: { session: {
        status: async () => ({ data: { ses_current: { type: "running" } } }),
        currentAgent: async () => ({ data: agent }),
        messages,
      } },
    }
    // when
    const snapshot = await buildTuiRuntimeSnapshot(input)
    // then
    expect(snapshot.activeAgents).toEqual([{ name: agent.toLowerCase(), status: "running" }])
    expect(messages).not.toHaveBeenCalled()
  })

  it.each([undefined, null, "", 42])("uses the session id when V2 metadata is unavailable (%s) without falling back to history", async (agent) => {
    // given
    const messages = mock(async () => historicalMessages())
    // when
    const snapshot = await buildTuiRuntimeSnapshot({
      projectDir: projectDir(),
      backgroundManager: { getTasksSnapshot: () => [] },
      client: { session: {
        status: async () => ({ data: { ses_missing: { type: "busy" } } }),
        currentAgent: async () => ({ data: agent }),
        messages,
      } },
    })
    // then
    expect(snapshot.activeAgents).toEqual([{ name: "ses_missing", status: "busy" }])
    expect(messages).not.toHaveBeenCalled()
  })

  it("degrades to the session id when metadata retrieval fails without reading history", async () => {
    // given
    const messages = mock(async () => historicalMessages())
    // when
    const snapshot = await buildTuiRuntimeSnapshot({
      projectDir: projectDir(),
      backgroundManager: { getTasksSnapshot: () => [] },
      client: { session: {
        status: async () => ({ data: { ses_failed: { type: "retry" } } }),
        currentAgent: async () => { throw new Error("session unavailable") },
        messages,
      } },
    })
    // then
    expect(snapshot.activeAgents).toEqual([{ name: "ses_failed", status: "retry" }])
    expect(messages).not.toHaveBeenCalled()
  })

  it("keeps historical agent inference for a legacy client without the metadata capability", async () => {
    // given
    const input = {
      projectDir: projectDir(),
      backgroundManager: { getTasksSnapshot: () => [] },
      client: { session: {
        status: async () => ({ data: { ses_legacy: { type: "busy" } } }),
        messages: async () => historicalMessages(),
      } },
    }
    // when
    const snapshot = await buildTuiRuntimeSnapshot(input)
    // then
    expect(snapshot.activeAgents).toEqual([{ name: "historical-agent", status: "busy" }])
  })
})
