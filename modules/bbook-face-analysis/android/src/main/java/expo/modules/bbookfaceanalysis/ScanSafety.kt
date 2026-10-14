package expo.modules.bbookfaceanalysis

import java.util.concurrent.atomic.AtomicBoolean

internal data class MemorySample(val pssKB: Long, val lowMemory: Boolean, val availableKB: Long, val systemThresholdKB: Long)
internal data class Admission(val reason: String, val sample: MemorySample?, val limitKB: Long, val headroomKB: Long) {
  val allowed get() = reason == "allowed"
}

// Provisional PoC policy, NOT a calibrated device budget. Keep the absolute
// ceiling and growth allowance; never grow an anchor after every request.
// Cold initialization is measured separately from the first cleaned warm idle.
internal class ScanMemoryGuard {
  @Volatile var coldPssKB = 0L
    private set
  @Volatile var warmedIdlePssKB = 0L
    private set
  @Volatile var cleanupComplete = true
  @Synchronized fun decide(sample: MemorySample?, headroomKB: Long = REQUEST_HEADROOM_KB): Admission {
    val limit = minOf(ABSOLUTE_LIMIT_KB, if (warmedIdlePssKB > 0) warmedIdlePssKB + GROWTH_KB else ABSOLUTE_LIMIT_KB)
    if (sample != null && sample.pssKB > 0 && coldPssKB == 0L) coldPssKB = sample.pssKB
    val reason = when {
      !cleanupComplete -> "cleanup_incomplete"
      sample == null || sample.pssKB <= 0 || sample.availableKB <= 0 -> "unavailable"
      sample.lowMemory || sample.availableKB <= sample.systemThresholdKB -> "system_pressure"
      sample.pssKB >= limit || limit - sample.pssKB < headroomKB ||
        sample.availableKB - sample.systemThresholdKB < headroomKB -> "insufficient_budget"
      else -> "allowed"
    }
    // No latched pressure bit: the next idle admission must satisfy the same
    // current system/budget checks. UI reset cannot approve anything.
    return Admission(reason, sample, limit, headroomKB)
  }
  @Synchronized fun cleanedWarmIdle(sample: MemorySample?) {
    if (warmedIdlePssKB == 0L && sample != null && decide(sample, 0).allowed) warmedIdlePssKB = sample.pssKB
  }
  companion object {
    const val ABSOLUTE_LIMIT_KB = 768L * 1024
    // Allow more consecutive scans while retaining the fixed warm anchor,
    // absolute ceiling, request reserve, and current system pressure checks.
    const val GROWTH_KB = 256L * 1024
    const val REQUEST_HEADROOM_KB = 64L * 1024
  }
}

// A common lease replaces the check-then-CAS race between two separate flags.
internal class ScanLease {
  private val active = AtomicBoolean(false)
  val busy get() = active.get()
  fun acquire() = active.compareAndSet(false, true)
  fun release() { active.set(false) }
}

// Only the terminal winner may map a result, release resources, and settle JS.
internal class ScanTerminal {
  private val settled = AtomicBoolean(false)
  fun claim() = settled.compareAndSet(false, true)
}

internal class ScanResources {
  private val releases = mutableListOf<() -> Unit>()
  fun own(release: () -> Unit) { releases.add(release) }
  fun close(): Int {
    var failures = 0
    for (release in releases.asReversed()) {
      try { release() } catch (_: Throwable) { failures++ }
    }
    releases.clear()
    return failures
  }
}
internal class ScanCleanupFailure : RuntimeException("Resource cleanup incomplete")
