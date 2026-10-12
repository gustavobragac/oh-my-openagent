/**
 * Joins the goal loop (this hook) and the OpenChamber goal sync (`v2/goal-sync.ts`)
 * of one project without wiring either through the other's constructor: the
 * sync is created by the OpenCode 2 host, the hook by the session hooks.
 *
 * - Before a continuation, the loop asks the sync to apply what the user did
 *   in OpenChamber, so a Pause that aborted the turn is seen before the idle
 *   that abort caused sends the next continuation.
 * - A Resume made in OpenChamber wakes the loop, since an idle session gets no
 *   further idle event on its own.
 */
type Bridge = {
  sync?: (sessionID: string) => Promise<void>
  wake?: (sessionID: string) => void
}

const bridges = new Map<string, Bridge>()

const bridge = (projectDir: string): Bridge => {
  let entry = bridges.get(projectDir)
  if (!entry) {
    entry = {}
    bridges.set(projectDir, entry)
  }
  return entry
}

export function registerGoalSync(projectDir: string, sync: (sessionID: string) => Promise<void>): () => void {
  const entry = bridge(projectDir)
  entry.sync = sync
  return () => { if (entry.sync === sync) delete entry.sync }
}

export function registerGoalWake(projectDir: string, wake: (sessionID: string) => void): () => void {
  const entry = bridge(projectDir)
  entry.wake = wake
  return () => { if (entry.wake === wake) delete entry.wake }
}

/** Applies OpenChamber changes to this session's goal; a no-op without a sync. */
export async function syncGoalFromClient(projectDir: string, sessionID: string): Promise<void> {
  await bridges.get(projectDir)?.sync?.(sessionID)
}

/** Lets the loop continue a goal the user resumed; a no-op without a loop. */
export function wakeGoal(projectDir: string, sessionID: string): void {
  bridges.get(projectDir)?.wake?.(sessionID)
}
