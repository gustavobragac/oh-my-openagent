import { platform } from "os"

export type Platform = "darwin" | "linux" | "win32" | "unsupported"

export function detectPlatform(
  detected: string = platform(),
  env: Readonly<Record<string, string | undefined>> = process.env,
): Platform {
  if (detected === "darwin" || detected === "win32") return detected
  // A headless Linux server has no notification daemon to show anything, and building the
  // notification reads the whole session history on every idle.
  if (detected === "linux") return env.DISPLAY || env.WAYLAND_DISPLAY ? "linux" : "unsupported"
  return "unsupported"
}

export function getDefaultSoundPath(platform: Platform): string {
  switch (platform) {
    case "darwin":
      return "/System/Library/Sounds/Glass.aiff"
    case "linux":
      return "/usr/share/sounds/freedesktop/stereo/complete.oga"
    case "win32":
      return "C:\\Windows\\Media\\notify.wav"
    default:
      return ""
  }
}
