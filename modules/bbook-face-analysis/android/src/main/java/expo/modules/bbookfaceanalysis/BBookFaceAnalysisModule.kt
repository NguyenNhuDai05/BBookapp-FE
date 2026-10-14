package expo.modules.bbookfaceanalysis

import android.graphics.BitmapFactory
import android.net.Uri
import android.content.pm.ApplicationInfo
import android.os.Handler
import android.os.Looper
import android.util.Log
import org.json.JSONObject
import java.util.concurrent.atomic.AtomicInteger
import android.os.Debug
import android.os.SystemClock
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.Face
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetectorOptions
import com.google.mlkit.vision.facemesh.FaceMesh
import com.google.mlkit.vision.facemesh.FaceMeshDetection
import com.google.mlkit.vision.facemesh.FaceMeshDetectorOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class BBookFaceAnalysisModule : Module() {
  private val lease = ScanLease()
  private val guard = ScanMemoryGuard()
  private val inferenceStarted = AtomicInteger(0)
  private val inferenceEnded = AtomicInteger(0)
  private val sdkProcessCalls = AtomicInteger(0)
  private fun sample(): MemorySample? = runCatching {
    val c = appContext.reactContext ?: return@runCatching null
    val info = android.app.ActivityManager.MemoryInfo()
    (c.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager).getMemoryInfo(info)
    MemorySample(Debug.getPss(), info.lowMemory, info.availMem / 1024, info.threshold / 1024)
  }.getOrNull()
  private fun decision(): Admission = if (lease.busy) Admission("busy", null, 0, 0) else guard.decide(sample())
  private fun code(reason: String) = when (reason) {
    "busy" -> "E_BUSY"
    "system_pressure" -> "E_SYSTEM_MEMORY_PRESSURE"
    "insufficient_budget" -> "E_MEMORY_BUDGET"
    "cleanup_incomplete" -> "E_CLEANUP_PENDING"
    else -> "E_NATIVE_UNAVAILABLE"
  }

  private val ids = AtomicInteger(0)
  private val created = AtomicInteger(0)
  private val closed = AtomicInteger(0)
  private val normalizationStarted = mutableMapOf<String, Long>()
  private val handler = Handler(Looper.getMainLooper())
  private val normalizerEpoch = AtomicInteger(0)
  @Volatile private var availabilityObserver: CameraAvailabilityObserver? = null
  @Volatile private var advisorCameraWasUsed = false
  @Volatile private var diagnosticSession = "startup"
  @Synchronized private fun cameraObserver(): CameraAvailabilityObserver? {
    if (availabilityObserver != null) return availabilityObserver
    val context = appContext.reactContext ?: return null
    return runCatching { CameraAvailabilityObserver(context, handler) { snapshot ->
      if (runCatching { diagnostic() }.getOrDefault(false)) sendEvent("onCameraAvailability",
        snapshot + mapOf("session" to diagnosticSession, "timestampMs" to System.currentTimeMillis(),
          "checkpoint" to "camera_availability"))
    }.also { availabilityObserver = it } }.getOrNull()
  }
  private fun memoryBreakdown(): Map<String, Any> = runCatching {
    val context = appContext.reactContext ?: return@runCatching emptyMap<String, Any>()
    val runtime = Runtime.getRuntime()
    val manager = context.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
    val info = Debug.MemoryInfo(); Debug.getMemoryInfo(info)
    mapOf<String, Any>("breakdownTimestampMs" to System.currentTimeMillis(), "memoryInfoPssKB" to info.totalPss, "dalvikPssKB" to info.dalvikPss,
      "nativePssKB" to info.nativePss, "otherPssKB" to info.otherPss,
      "graphicsKB" to (info.getMemoryStat("summary.graphics")?.toLongOrNull() ?: -1L),
      "javaUsedKB" to ((runtime.totalMemory() - runtime.freeMemory()) / 1024),
      "javaMaxKB" to (runtime.maxMemory() / 1024), "nativeAllocKB" to (Debug.getNativeHeapAllocatedSize() / 1024),
      "memoryClassMiB" to manager.memoryClass, "largeMemoryClassMiB" to manager.largeMemoryClass,
      "debuggable" to ((context.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0),
      "inferenceStarted" to inferenceStarted.get(), "inferenceEnded" to inferenceEnded.get(),
      "sdkProcessCalls" to sdkProcessCalls.get(), "detectorsCreated" to created.get(), "detectorCloseCalls" to closed.get(),
      "warmBaselineMeasured" to (guard.warmedIdlePssKB > 0))
  }.getOrDefault(emptyMap())
  private fun enabled(): Boolean {
    val c = appContext.reactContext ?: return false
    // Binary-level opt-in written only by the approved internal build profiles.
    // Release APK preview can run offline; production config writes false.
    return c.packageManager.getApplicationInfo(c.packageName, android.content.pm.PackageManager.GET_META_DATA).metaData?.getBoolean("com.bbook.advisor.enabled", false) == true
  }
  private fun mark(id: String, stage: String, started: Long, width: Int = 0, height: Int = 0, bytes: Int = 0, extra: Map<String, Int> = emptyMap(), terminalReason: String? = null) {
    if (!runCatching { diagnostic() }.getOrDefault(false)) return
    // Fixed scalar schema. Never accept URI, exception, face data or arbitrary strings.
    runCatching {
      val runtime = Runtime.getRuntime()
      val sampledPss = Debug.getPss()
      val row = JSONObject().put("requestId", id).put("stage", stage)
        .put("timestampMs", System.currentTimeMillis()).put("durationMs", SystemClock.elapsedRealtime() - started)
        .put("pid", android.os.Process.myPid()).put("nativeAllocBytes", Debug.getNativeHeapAllocatedSize())
        .put("pssKB", sampledPss).put("javaUsedBytes", runtime.totalMemory() - runtime.freeMemory())
        .put("bitmapWidth", width).put("bitmapHeight", height).put("bitmapBytes", bytes)
        .put("detectorsCreated", created.get()).put("detectorCloseCalls", closed.get())
        .put("inferenceStarted", inferenceStarted.get()).put("inferenceEnded", inferenceEnded.get()).put("sdkProcessCalls", sdkProcessCalls.get())
        .put("coldBaselinePssKB", guard.coldPssKB).put("warmedIdlePssKB", guard.warmedIdlePssKB)
      if (terminalReason in setOf("success","E_INPUT","E_DETECTION","E_SYSTEM_MEMORY_PRESSURE","E_MEMORY_BUDGET","E_CLEANUP_PENDING","E_SCAN_CANCELLED","E_NORMALIZATION_INPUT","E_NATIVE_UNAVAILABLE")) row.put("terminalReason", terminalReason)
      extra.forEach { (key, value) -> row.put(key, value) }
      Log.i("BBookPocMemory", row.toString())
    }
  }
  private fun diagnostic(): Boolean {
    val c = appContext.reactContext ?: return false
    return enabled() && ((c.applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0 ||
      c.packageManager.getApplicationInfo(c.packageName, android.content.pm.PackageManager.GET_META_DATA).metaData?.getBoolean("com.bbook.advisor.diagnostics", false) == true)
  }
  @Volatile private var lastAdmissionDiagnostic: Map<String, Any> = emptyMap()
  private fun logAdmission(id: String, d: Admission, checkpoint: String = "frontend_admission") {
    if (!runCatching { diagnostic() }.getOrDefault(false)) return
    runCatching {
      lastAdmissionDiagnostic = mapOf("timestampMs" to System.currentTimeMillis(), "checkpoint" to checkpoint,
        "reason" to d.reason, "pssKB" to (d.sample?.pssKB ?: 0), "limitKB" to d.limitKB,
        "requiredHeadroomKB" to d.headroomKB, "cleanupComplete" to guard.cleanupComplete, "systemLowMemory" to (d.sample?.lowMemory ?: false),
        "availableKB" to (d.sample?.availableKB ?: 0), "systemThresholdKB" to (d.sample?.systemThresholdKB ?: 0),
        "coldBaselinePssKB" to guard.coldPssKB, "warmedIdlePssKB" to guard.warmedIdlePssKB) + memoryBreakdown() + (availabilityObserver?.snapshot() ?: emptyMap()) + mapOf("session" to diagnosticSession)
      Log.i("BBookPocMemory", JSONObject().put("requestId", id).put("stage", "admission").put("checkpoint", checkpoint).put("timestampMs", System.currentTimeMillis()).put("pid", android.os.Process.myPid())
        .put("reason", d.reason).put("pssKB", d.sample?.pssKB ?: 0).put("limitKB", d.limitKB)
        .put("requiredHeadroomKB", d.headroomKB).put("systemLowMemory", d.sample?.lowMemory ?: false)
        .put("availableKB", d.sample?.availableKB ?: 0).put("systemThresholdKB", d.sample?.systemThresholdKB ?: 0)
        .put("coldBaselinePssKB", guard.coldPssKB).put("warmedIdlePssKB", guard.warmedIdlePssKB).toString()) }
  }
  override fun definition() = ModuleDefinition {
    Name("BBookFaceAnalysis")
    Events("onDetection", "onCameraAvailability")
    Function("memorySnapshot") { session: String, checkpoint: String ->
      if (enabled() && session.matches(Regex("s[0-9]+")) && checkpoint in setOf("advisor_enter", "camera_mount", "camera_ready", "capture_start", "capture_success", "camera_unmount", "preprocess_end", "mlkit_start", "mlkit_end", "scan_cleanup")) {
        diagnosticSession = session
        if (checkpoint == "advisor_enter" || checkpoint == "camera_mount") cameraObserver()
        if (diagnostic()) memoryBreakdown() + (availabilityObserver?.snapshot() ?: emptyMap()) + mapOf("session" to session, "checkpoint" to checkpoint, "timestampMs" to System.currentTimeMillis())
        else emptyMap<String, Any>()
      } else emptyMap<String, Any>()
    }
    Function("beginCameraObservation") { if (enabled()) { advisorCameraWasUsed = true; cameraObserver() }; Unit }
    Function("stopCameraObservation") { availabilityObserver?.close(); availabilityObserver = null; advisorCameraWasUsed = false }
    AsyncFunction("awaitCameraAvailable") { session: String, required: Boolean, promise: Promise ->
      if (!enabled()) { promise.reject("E_NATIVE_UNAVAILABLE", "Unavailable", null); return@AsyncFunction }
      if (session.matches(Regex("s[0-9]+"))) diagnosticSession = session
      if (!required && !advisorCameraWasUsed) { promise.resolve("not_required"); return@AsyncFunction }
      val observer = cameraObserver()
      if (observer == null) promise.reject("E_CAMERA_RELEASE_PENDING", "Camera availability unknown", null)
      else observer.awaitAvailable { available, _ ->
        if (available) promise.resolve("available") else promise.reject("E_CAMERA_RELEASE_PENDING", "Camera availability not confirmed", null)
      }
    }
    Function("memoryDiagnostics") { if (diagnostic()) lastAdmissionDiagnostic else emptyMap<String, Any>() }
    Function("prepareMemoryGuard") { enabled() && decision().allowed }
    Function("admissionDecision") {
      val d = if (enabled()) decision() else Admission("unavailable", null, 0, 0)
      logAdmission("p${ids.incrementAndGet()}", d)
      mapOf("allowed" to d.allowed, "reason" to d.reason)
    }
    Function("instrumentationVersion") { if (enabled()) "scan-camera-memory-v4" else "disabled" }
    Function("cancelNormalization") { normalizerEpoch.incrementAndGet() }
    OnActivityEntersBackground { normalizerEpoch.incrementAndGet() }
    AsyncFunction("normalizeBounded") { uri: String, pickerWidth: Int, pickerHeight: Int, promise: Promise ->
      if (!enabled()) { promise.reject("E_NATIVE_UNAVAILABLE", "Unavailable", null); return@AsyncFunction }
      if (!lease.acquire()) { promise.reject("E_BUSY", "Busy", null); return@AsyncFunction }
      val admission = guard.decide(sample())
      if (!admission.allowed) { logAdmission("p${ids.incrementAndGet()}", admission, "normalize_admission"); lease.release(); promise.reject(code(admission.reason), "Admission rejected", null); return@AsyncFunction }
      val id = "b${ids.incrementAndGet()}"
      val started = SystemClock.elapsedRealtime()
      val epoch = normalizerEpoch.get()
      logAdmission(id, admission, "normalize_admission")
      var normalized: Map<String, Any>? = null
      var normalizationCode: String? = null
      try {
        val context = appContext.reactContext ?: error("No context")
        val result = BoundedNormalizer().normalize(context, uri, pickerWidth, pickerHeight,
          { epoch != normalizerEpoch.get() }, { stage, values -> mark(id, stage, started, extra = values) }, {
            val d = guard.decide(sample(), 0)
            if (!d.allowed) { logAdmission(id, d, "normalize_checkpoint"); normalizationCode = code(d.reason); throw java.util.concurrent.CancellationException() }
          })
        normalized = result
      } catch (_: java.util.concurrent.CancellationException) {
        normalizationCode = normalizationCode ?: "E_SCAN_CANCELLED"
      } catch (_: ScanCleanupFailure) {
        guard.cleanupComplete = false; normalizationCode = "E_CLEANUP_PENDING"
      } catch (_: OutOfMemoryError) {
        normalizationCode = "E_SYSTEM_MEMORY_PRESSURE"
      } catch (_: Exception) {
        normalizationCode = "E_NORMALIZATION_INPUT"
      } finally {
        lease.release()
      }
      if (normalizationCode == null && epoch != normalizerEpoch.get()) {
        normalized?.get("uri")?.let { runCatching { File(Uri.parse(it as String).path!!).delete() } }
        normalizationCode = "E_SCAN_CANCELLED"
      }
      mark(id, "native_end", started, terminalReason = normalizationCode ?: "success")
      if (normalizationCode != null) promise.reject(normalizationCode!!, "Normalization did not complete", null)
      else promise.resolve(normalized)
    }
    Function("memoryMark") { id: String, stage: String ->
      require(id.matches(Regex("n[0-9]+")))
      require(stage in setOf("normalization_start", "normalization_end", "normalization_release"))
      mark(id, stage, normalizationStarted.getOrPut(id) { SystemClock.elapsedRealtime() })
      if (stage == "normalization_release") normalizationStarted.remove(id)
    }
    OnDestroy { normalizerEpoch.incrementAndGet(); handler.removeCallbacksAndMessages(null); availabilityObserver?.close(); availabilityObserver = null; normalizationStarted.clear() }
    AsyncFunction("analyze") { uri: String, promise: Promise ->
      if (!enabled()) { promise.reject("E_NATIVE_UNAVAILABLE", "Unavailable", null); return@AsyncFunction }
      if (!lease.acquire()) { promise.reject("E_BUSY", "Busy", null); return@AsyncFunction }
      val admission = guard.decide(sample())
      if (!admission.allowed) { logAdmission("p${ids.incrementAndGet()}", admission, "analyze_admission"); lease.release(); promise.reject(code(admission.reason), "Admission rejected", null); return@AsyncFunction }
      val requestId = "a${ids.incrementAndGet()}"
      val requestStarted = SystemClock.elapsedRealtime()
      val epoch = normalizerEpoch.get()
      val resources = ScanResources()
      val terminal = ScanTerminal()
      var fullyWarmed = false
      inferenceStarted.incrementAndGet()
      logAdmission(requestId, admission, "analyze_admission")
      mark(requestId, "native_start", requestStarted)
      fun complete(errorCode: String? = null, build: (() -> Map<String, Any?>)? = null) {
        if (!terminal.claim()) return
        var endCode = if (epoch != normalizerEpoch.get()) "E_SCAN_CANCELLED" else errorCode
        var result: Map<String, Any?>? = null
        try {
          if (endCode == null) result = build?.invoke()
        } catch (_: Exception) { endCode = "E_DETECTION" }
          catch (_: LinkageError) { endCode = "E_DETECTION" }
          catch (_: OutOfMemoryError) { endCode = "E_SYSTEM_MEMORY_PRESSURE" }
        finally {
          if (epoch != normalizerEpoch.get()) endCode = "E_SCAN_CANCELLED"
          mark(requestId, "before_cleanup", requestStarted)
          val failures = resources.close()
          if (failures > 0) { guard.cleanupComplete = false; endCode = "E_CLEANUP_PENDING" }
          // No-face or a skipped/failed cold mesh is not a warmed full pipeline.
          if (endCode == null && fullyWarmed) guard.cleanedWarmIdle(sample())
          inferenceEnded.incrementAndGet()
          mark(requestId, "cleanup_requested", requestStarted, extra = mapOf("cleanupFailures" to failures))
          lease.release()
          mark(requestId, "native_end", requestStarted, terminalReason = endCode ?: "success")
          if (diagnostic()) handler.postDelayed({ mark(requestId, if (lease.busy) "delayed_sample_busy" else "idle_after_cleanup", requestStarted) }, 5000)
        }
        if (endCode == null) promise.resolve(result) else promise.reject(endCode!!, "Analysis did not complete", null)
      }
      fun checkpoint(): Boolean {
        if (epoch != normalizerEpoch.get()) { complete("E_SCAN_CANCELLED"); return false }
        val d = guard.decide(sample(), 0)
        if (!d.allowed) { logAdmission(requestId, d, "analyze_checkpoint"); complete(code(d.reason)); return false }
        return true
      }
      try {
        val context = appContext.reactContext ?: error("No Android context")
        val parsed = Uri.parse(uri)
        require(parsed.scheme == "file") { "Only normalized local cache files are accepted" }
        val file = File(parsed.path ?: error("Missing path")).canonicalFile
        require(file.path.startsWith(context.cacheDir.canonicalPath + File.separator)) { "Image must be in app cache" }
        require(file.length() in 1..(5L * 1024 * 1024)) { "Image size exceeds limit" }
        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.path, bounds)
        require(bounds.outMimeType == "image/jpeg") { "Normalize to JPEG first" }
        require(bounds.outWidth >= 128 && bounds.outHeight >= 128 && bounds.outWidth.toLong() * bounds.outHeight <= 4_000_000) { "Invalid image dimensions" }
        // Both normalizers rasterize EXIF orientation before this decode. No extra mirror/rotation.
        mark(requestId, "before_bitmap_decode", requestStarted)
        val bitmap = BitmapFactory.decodeFile(file.path) ?: error("Cannot decode image")
        mark(requestId, "after_bitmap_decode", requestStarted, bitmap.width, bitmap.height, bitmap.byteCount)
        resources.own { bitmap.recycle() }
        val image = InputImage.fromBitmap(bitmap, 0)
        val started = SystemClock.elapsedRealtime()
        val memoryBefore = Debug.getNativeHeapAllocatedSize()
        val countDetector = FaceDetection.getClient(options(false))
        created.incrementAndGet()
        resources.own { countDetector.close(); closed.incrementAndGet() }
        val contourDetector = FaceDetection.getClient(options(true))
        created.incrementAndGet()
        resources.own { contourDetector.close(); closed.incrementAndGet() }
        mark(requestId, "after_detector_creation", requestStarted)
        fun fail() { complete("E_DETECTION") }
        fun resolve(faces: List<Face>, contours: Face?, mesh: FaceMesh? = null) {
          complete(build = { mapOf(
            "width" to bitmap.width, "height" to bitmap.height,
            "faceCount" to faces.size,
            "faces" to faces.map { face ->
              mapOf("box" to mapOf("x" to face.boundingBox.left, "y" to face.boundingBox.top,
                "width" to face.boundingBox.width(), "height" to face.boundingBox.height()),
                "angles" to mapOf("x" to face.headEulerAngleX, "y" to face.headEulerAngleY, "z" to face.headEulerAngleZ),
                "probabilities" to mapOf("leftEyeOpen" to face.leftEyeOpenProbability, "rightEyeOpen" to face.rightEyeOpenProbability, "smiling" to face.smilingProbability),
                "landmarks" to face.allLandmarks.map { mapOf("type" to it.landmarkType, "x" to it.position.x, "y" to it.position.y) })
            },
            "contours" to (contours?.allContours?.map { contour ->
              mapOf("type" to contour.faceContourType, "points" to contour.points.map { mapOf("x" to it.x, "y" to it.y) })
            } ?: emptyList()),
            "mesh" to mesh?.let { m -> mapOf(
              "points" to m.allPoints.map { p -> mapOf("index" to p.index, "x" to p.position.x, "y" to p.position.y, "z" to p.position.z) },
              "triangles" to m.allTriangles.map { triangle -> triangle.allPoints.map { it.index } }
              ,"regions" to mapOf(
                "outline" to FaceMesh.FACE_OVAL, "leftEye" to FaceMesh.LEFT_EYE, "rightEye" to FaceMesh.RIGHT_EYE,
                "leftBrowTop" to FaceMesh.LEFT_EYEBROW_TOP, "leftBrowBottom" to FaceMesh.LEFT_EYEBROW_BOTTOM,
                "rightBrowTop" to FaceMesh.RIGHT_EYEBROW_TOP, "rightBrowBottom" to FaceMesh.RIGHT_EYEBROW_BOTTOM,
                "upperLipTop" to FaceMesh.UPPER_LIP_TOP, "upperLipBottom" to FaceMesh.UPPER_LIP_BOTTOM,
                "lowerLipTop" to FaceMesh.LOWER_LIP_TOP, "lowerLipBottom" to FaceMesh.LOWER_LIP_BOTTOM,
                "noseBridge" to FaceMesh.NOSE_BRIDGE
              ).mapValues { (_, type) -> m.getPoints(type).map { it.index } }
            ) },
            "meshStatus" to if (mesh != null) "available" else "unavailable",
            "latencyMs" to (SystemClock.elapsedRealtime() - started),
            "nativeHeapBeforeBytes" to memoryBefore,
            "nativeHeapAfterBytes" to Debug.getNativeHeapAllocatedSize()
          )
          })
        }
        // Each SDK task reaches completion before releasing its image or
        // starting the next stage. Cancellation only stops subsequent stages.
        fun handle(action: () -> Unit) {
          try { action() } catch (_: Exception) { complete("E_DETECTION") }
            catch (_: LinkageError) { complete("E_DETECTION") }
            catch (_: OutOfMemoryError) { complete("E_SYSTEM_MEMORY_PRESSURE") }
        }
        fun mesh(faces: List<Face>, contourFace: Face?) {
          val meshAdmission = guard.decide(sample())
          if (!meshAdmission.allowed) {
            logAdmission(requestId, meshAdmission, "mesh_admission")
            if (meshAdmission.reason == "insufficient_budget") resolve(faces, contourFace)
            else complete(code(meshAdmission.reason))
            return
          }
          // Mesh remains optional. Failed initialization preserves contours.
          val detector = try {
            FaceMeshDetection.getClient(FaceMeshDetectorOptions.Builder().setUseCase(FaceMeshDetectorOptions.FACE_MESH).build())
          } catch (_: Exception) { resolve(faces, contourFace); return }
            catch (_: LinkageError) { resolve(faces, contourFace); return }
          created.incrementAndGet()
          resources.own { detector.close(); closed.incrementAndGet() }
          sdkProcessCalls.incrementAndGet()
          detector.process(image).addOnCompleteListener { task -> handle {
            mark(requestId, "after_mesh_detection", requestStarted)
            if (checkpoint()) {
              fullyWarmed = task.isSuccessful
              val validMesh = if (task.isSuccessful) task.result.singleOrNull()?.takeIf { m ->
                MeshTopology.valid(m.allPoints.map { it.index }, m.allTriangles.map { t -> t.allPoints.map { it.index } }) &&
                MeshTopology.validCoordinates(m.allPoints.map { Triple(it.position.x, it.position.y, it.position.z) }, bitmap.width, bitmap.height) &&
                android.graphics.Rect.intersects(m.boundingBox, faces[0].boundingBox)
              } else null
              resolve(faces, contourFace, validMesh)
            }
          } }
        }
        sdkProcessCalls.incrementAndGet()
        countDetector.process(image).addOnCompleteListener { countTask -> handle {
          mark(requestId, "after_face_count", requestStarted)
          if (checkpoint()) {
            if (!countTask.isSuccessful) fail()
            else {
              val faces = countTask.result
              if (faces.size != 1) resolve(faces, null)
              else {
                sdkProcessCalls.incrementAndGet()
                contourDetector.process(image).addOnCompleteListener { contourTask -> handle {
                mark(requestId, "after_contour_detection", requestStarted)
                if (checkpoint()) {
                  if (!contourTask.isSuccessful) fail()
                  else {
                    val contourFace = contourTask.result.singleOrNull()
                    // Publish genuine contours while optional mesh inference is running.
                    runCatching { sendEvent("onDetection", mapOf(
                      "width" to bitmap.width, "height" to bitmap.height, "faceCount" to faces.size,
                      "faces" to faces.map { f -> mapOf(
                        "box" to mapOf("x" to f.boundingBox.left, "y" to f.boundingBox.top, "width" to f.boundingBox.width(), "height" to f.boundingBox.height()),
                        "angles" to mapOf("x" to f.headEulerAngleX, "y" to f.headEulerAngleY, "z" to f.headEulerAngleZ)) },
                      "contours" to (contourFace?.allContours?.map { c -> mapOf("type" to c.faceContourType, "points" to c.points.map { mapOf("x" to it.x, "y" to it.y) }) } ?: emptyList()),
                      "latencyMs" to (SystemClock.elapsedRealtime() - started),
                      "nativeHeapBeforeBytes" to memoryBefore, "nativeHeapAfterBytes" to Debug.getNativeHeapAllocatedSize()
                    )) }
                    mesh(faces, contourFace)
                  }
                }
              } }
              }
            }
          }
        } }
      } catch (_: Exception) {
        complete("E_INPUT")
      } catch (_: LinkageError) { complete("E_INPUT") }
        catch (_: OutOfMemoryError) { complete("E_SYSTEM_MEMORY_PRESSURE") }
    }
  }

  private fun options(contours: Boolean) = FaceDetectorOptions.Builder()
    .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
    .setLandmarkMode(if (contours) FaceDetectorOptions.LANDMARK_MODE_NONE else FaceDetectorOptions.LANDMARK_MODE_ALL)
    .setClassificationMode(if (contours) FaceDetectorOptions.CLASSIFICATION_MODE_NONE else FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
    .setContourMode(if (contours) FaceDetectorOptions.CONTOUR_MODE_ALL else FaceDetectorOptions.CONTOUR_MODE_NONE)
    .setMinFaceSize(0.1f)
    .build()
}
