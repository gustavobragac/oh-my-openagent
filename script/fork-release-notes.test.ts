import { describe, expect, test } from "bun:test"

import { forkReleaseSection } from "./fork-release-notes"

const changelog = `# Fork changelog

## [5.0.1-fork.2] - 2026-10-12

### Fixed

- Second.

## [5.0.1-fork.1] - 2026-10-11

### Added

- First.
`

describe("forkReleaseSection", () => {
  test("returns one release's notes without its heading and stops at the next release", () => {
    expect(forkReleaseSection(changelog, "5.0.1-fork.2")).toEqual({ date: "2026-10-12", body: "### Fixed\n\n- Second." })
    expect(forkReleaseSection(changelog, "5.0.1-fork.1").body).toBe("### Added\n\n- First.")
  })

  test("refuses a missing or empty section", () => {
    expect(() => forkReleaseSection(changelog, "5.0.1-fork.3")).toThrow("no")
    expect(() => forkReleaseSection("## [5.0.1-fork.1] - 2026-10-11\n\n## [5.0.0-fork.1] - 2026-10-01\n- x\n", "5.0.1-fork.1")).toThrow("empty")
  })

  test("does not treat dots in the version as wildcards", () => {
    expect(() => forkReleaseSection("## [5x0x1-fork.1] - 2026-10-11\n- x\n", "5.0.1-fork.1")).toThrow("no")
  })
})
