package expo.modules.bbookfaceanalysis

// Availability is an OS signal, not proof that graphics/native memory was reclaimed.
internal class CameraAvailabilityState(private val expected: Set<String>) {
  private val available = mutableMapOf<String, Boolean>()
  var lastUnavailableMs = 0L
    private set
  var lastAvailableMs = 0L
    private set
  @Synchronized fun update(id: String, value: Boolean, nowMs: Long) {
    if (id !in expected) return
    available[id] = value
    if (value) lastAvailableMs = nowMs else lastUnavailableMs = nowMs
  }
  @Synchronized fun idle() = expected.isNotEmpty() && expected.all { available[it] == true }
  @Synchronized fun snapshot(): Map<String, Any> = mapOf(
    "cameraTrackedCount" to expected.size, "cameraKnownCount" to available.size,
    "cameraUnavailableCount" to available.values.count { !it },
    "cameraAvailable" to idle(), "cameraUnavailableTimestampMs" to lastUnavailableMs,
    "cameraAvailableTimestampMs" to lastAvailableMs,
    "cameraAvailabilityTransitionObserved" to (lastUnavailableMs > 0 && idle()))
}
