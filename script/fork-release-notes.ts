#!/usr/bin/env bun
/**
 * Release notes of one fork release: its section of FORK_CHANGELOG.md
 * ("## [<version>] - YYYY-MM-DD" up to the next "## ["), without the heading.
 * Fails when the section is missing or empty, so a release never ships
 * without notes.
 */
import { readFileSync } from "node:fs"

export function forkReleaseSection(changelog: string, version: string): { date: string; body: string } {
  const lines = changelog.split("\n")
  const heading = new RegExp(`^## \\[${version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\] - (\\d{4}-\\d{2}-\\d{2})\\s*$`)
  const start = lines.findIndex((line) => heading.test(line))
  if (start < 0) throw new Error(`FORK_CHANGELOG.md has no "## [${version}] - YYYY-MM-DD" section`)
  const date = heading.exec(lines[start] ?? "")?.[1] ?? ""
  const next = lines.findIndex((line, index) => index > start && line.startsWith("## ["))
  const body = lines.slice(start + 1, next < 0 ? undefined : next).join("\n").trim()
  if (!body) throw new Error(`The ${version} section of FORK_CHANGELOG.md is empty`)
  return { date, body }
}

if (import.meta.main) {
  const version = process.argv[2]
  if (!version) throw new Error("usage: fork-release-notes.ts <version>")
  process.stdout.write(`${forkReleaseSection(readFileSync("FORK_CHANGELOG.md", "utf8"), version).body}\n`)
}
