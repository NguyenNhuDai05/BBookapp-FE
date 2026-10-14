package expo.modules.bbookfaceanalysis

import android.content.Context
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Handler
import java.util.concurrent.atomic.AtomicBoolean

// Uses Android's existing API; does not open/control cameras or change Expo CameraX.
internal class CameraAvailabilityObserver(context: Context, private val handler: Handler,
  private val changed: (Map<String, Any>) -> Unit) {
  private val manager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
  private val ids = manager.cameraIdList.filter {
    val facing = manager.getCameraCharacteristics(it).get(CameraCharacteristics.LENS_FACING)
    facing == CameraCharacteristics.LENS_FACING_FRONT || facing == CameraCharacteristics.LENS_FACING_BACK
  }.toSet()
  private val state = CameraAvailabilityState(ids)
  private val waiters = mutableSetOf<(Boolean) -> Unit>()
  @Volatile private var closed = false
  private val callback = object : CameraManager.AvailabilityCallback() {
    override fun onCameraAvailable(cameraId: String) { update(cameraId, true) }
    override fun onCameraUnavailable(cameraId: String) { update(cameraId, false) }
  }
  init { manager.registerAvailabilityCallback(callback, handler) }
  private fun update(id: String, value: Boolean) {
    if (closed || id !in ids) return
    state.update(id, value, System.currentTimeMillis())
    runCatching { changed(state.snapshot()) }
    if (state.idle()) waiters.toList().forEach { it(true) }
  }
  fun snapshot() = state.snapshot()
  fun awaitAvailable(completed: (Boolean, Map<String, Any>) -> Unit) {
    handler.post {
      if (closed) { completed(false, state.snapshot()); return@post }
      if (state.idle()) { completed(true, state.snapshot()); return@post }
      val settled = AtomicBoolean(false)
      lateinit var finish: (Boolean) -> Unit
      val deadline = Runnable { finish(false) }
      finish = { ok ->
        if (settled.compareAndSet(false, true)) {
          handler.removeCallbacks(deadline); waiters.remove(finish)
          completed(ok, state.snapshot())
        }
      }
      waiters.add(finish)
      // A failure deadline only: never treat elapsed time as camera readiness.
      handler.postDelayed(deadline, 5000)
    }
  }
  fun close() {
    closed = true
    runCatching { manager.unregisterAvailabilityCallback(callback) }
    handler.post { waiters.toList().forEach { it(false) }; waiters.clear() }
  }
}
