import type { Plugin, ToolDefinition } from "@opencode-ai/plugin"
import type { TmuxConfig } from "@oh-my-opencode/tmux-core"

export type PluginContext = Parameters<Plugin>[0]
export type PluginInstance = Awaited<ReturnType<Plugin>>

type ChatHeadersHook = PluginInstance extends { "chat.headers"?: infer T }
  ? T
  : (input: unknown, output: unknown) => Promise<void>

export type PluginInterface = Omit<
  PluginInstance,
  "experimental.session.compacting" | "chat.headers"
> & {
  "chat.headers"?: ChatHeadersHook
  "session.retry"?: (input: {
    sessionID: string
    agent: string
    model: { providerID: string; id: string; variant?: string }
    error: { type: string; message: string; status?: number }
    attempt: number
  }) => Promise<boolean>
}

export type ToolsRecord = Record<string, ToolDefinition>

export type { TmuxConfig }
