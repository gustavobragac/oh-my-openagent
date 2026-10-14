import { describe, expect, it } from "bun:test"

import { detectPlatform } from "./session-notification-platform"

describe("detectPlatform", () => {
  it("treats Linux without a graphical session as unsupported", () => {
    // given / when
    const platform = detectPlatform("linux", {})
    // then
    expect(platform).toBe("unsupported")
  })

  it.each([{ DISPLAY: ":0" }, { WAYLAND_DISPLAY: "wayland-0" }])("keeps Linux with a graphical session (%o)", (env) => {
    // given / when
    const platform = detectPlatform("linux", env)
    // then
    expect(platform).toBe("linux")
  })

  it.each(["darwin", "win32"] as const)("keeps %s regardless of display variables", (os) => {
    // given / when
    const platform = detectPlatform(os, {})
    // then
    expect(platform).toBe(os)
  })
})
