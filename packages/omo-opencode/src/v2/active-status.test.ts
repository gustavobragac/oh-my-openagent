/// <reference types="bun-types" />
import { afterEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { createAdapterState } from "./adapter-state"
import { activeSessionStatusMap } from "./catalog"
import { buildTuiRuntimeSnapshot } from "../features/tui-sidebar/snapshot-builder"

const directories: string[] = []
afterEach(() => {
  for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true })
})

function state() {
  const directory = mkdtempSync(join(tmpdir(), "omo-active-status-"))
  directories.push(directory)
  return createAdapterState(directory)
}

describe("V2 sidebar active status", () => {
  test("shows a session already running without reading historical sessions", async () => {
    // given
    const adapter = state()
    const requested: string[] = []
    const activeStatus = async () => ({ data: await activeSessionStatusMap({
      state: adapter,
      origin: "http://127.0.0.1:9",
      fetchImpl: Object.assign(async (url: URL | RequestInfo) => {
        requested.push(String(url))
        return Response.json({ data: { ses_running: {} } })
      }, { preconnect: fetch.preconnect }),
    }) })
    // when
    const snapshot = await buildTuiRuntimeSnapshot({
      projectDir: adapter.directory,
      backgroundManager: { getTasksSnapshot: () => [] },
      client: { session: { activeStatus, status: async () => { throw new Error("historical status must not be queried") }, messages: async () => [] } },
      sessionAgentResolver: async () => "hephaestus",
    })
    // then
    expect(snapshot.activeAgents).toEqual([{ name: "hephaestus", status: "busy" }])
    expect(requested).toEqual(["http://127.0.0.1:9/api/session/active"])
  })

  test("local idle and retry transitions override a stale active response", async () => {
    // given
    const adapter = state()
    adapter.noteStatus("ses_done", "idle")
    adapter.noteStatus("ses_retry", "retry")
    // when
    const statuses = await activeSessionStatusMap({ state: adapter, origin: "http://127.0.0.1:9", fetchImpl: Object.assign(async () => Response.json({ data: { ses_done: {}, ses_retry: {} } }), { preconnect: fetch.preconnect }) })
    // then
    expect(statuses).toEqual({ ses_done: { type: "idle" }, ses_retry: { type: "retry" } })
  })

  test("keeps event state when the server is unavailable", async () => {
    // given
    const adapter = state()
    adapter.noteStatus("ses_running", "busy")
    // when
    const statuses = await activeSessionStatusMap({ state: adapter, origin: "http://127.0.0.1:9", fetchImpl: Object.assign(async () => { throw new Error("offline") }, { preconnect: fetch.preconnect }) })
    // then
    expect(statuses).toEqual({ ses_running: { type: "busy" } })
  })

  test("does not hide an authorization failure", async () => {
    // given
    const adapter = state()
    // when / then
    await expect(activeSessionStatusMap({ state: adapter, origin: "http://127.0.0.1:9", fetchImpl: Object.assign(async () => new Response("", { status: 401 }), { preconnect: fetch.preconnect }) })).rejects.toThrow("unauthorized")
  })
})
