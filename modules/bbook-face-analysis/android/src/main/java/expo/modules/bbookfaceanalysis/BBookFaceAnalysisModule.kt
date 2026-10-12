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
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.util.concurrent.atomic.AtomicBoolean

class BBookFaceAnalysisModule : Module() {
  private val busy = AtomicBoolean(false)
  private val acceptedAnalyses = AtomicInteger(0)
  private val memoryBaselineKB = java.util.concurrent.atomic.AtomicLong(0)
  private val memoryStopped = AtomicBoolean(false)
  private fun memorySafe(requiredHeadroomKB: Long = 0): Boolean {
    if (memoryStopped.get()) return false
    val c = appContext.reactContext ?: return false
    val info = android.app.ActivityManager.MemoryInfo()
    (c.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager).getMemoryInfo(info)
    val pss = Debug.getPss()
    memoryBaselineKB.compareAndSet(0, pss)
    val limit = minOf(768L * 1024, memoryBaselineKB.get() + 128L * 1024)
    if (info.lowMemory || pss >= limit) { memoryStopped.set(true); return false }
    return limit - pss >= requiredHeadroomKB
  }

  private val ids = AtomicInteger(0)
  private val created = AtomicInteger(0)
  private val closed = AtomicInteger(0)
  private val normalizationStarted = mutableMapOf<String, Long>()
  private val handler = Handler(Looper.getMainLooper())
  private val normalizing = AtomicBoolean(false)
  private val normalizerEpoch = AtomicInteger(0)
  private fun enabled(): Boolean {
    val c = appContext.reactContext ?: return false
    // Binary-level opt-in written only by the approved internal build profiles.
    // Release APK preview can run offline; production config writes false.
    return c.packageManager.getApplicationInfo(c.packageName, android.content.pm.PackageManager.GET_META_DATA).metaData?.getBoolean("com.bbook.advisor.enabled", false) == true
  }
  private fun mark(id: String, stage: String, started: Long, width: Int = 0, height: Int = 0, bytes: Int = 0, extra: Map<String, Int> = emptyMap()) {
    if (!enabled()) return
    // Fixed scalar schema. Never accept URI, exception, face data or arbitrary strings.
    runCatching {
      val runtime = Runtime.getRuntime()
      val sampledPss = Debug.getPss()
      if (memoryBaselineKB.get() > 0 && sampledPss >= minOf(768L * 1024, memoryBaselineKB.get() + 128L * 1024)) memoryStopped.set(true)
      val row = JSONObject().put("requestId", id).put("stage", stage)
        .put("timestampMs", System.currentTimeMillis()).put("durationMs", SystemClock.elapsedRealtime() - started)
        .put("pid", android.os.Process.myPid()).put("nativeAllocBytes", Debug.getNativeHeapAllocatedSize())
        .put("pssKB", sampledPss).put("javaUsedBytes", runtime.totalMemory() - runtime.freeMemory())
        .put("bitmapWidth", width).put("bitmapHeight", height).put("bitmapBytes", bytes)
        .put("detectorsCreated", created.get()).put("detectorCloseCalls", closed.get())
      extra.forEach { (key, value) -> row.put(key, value) }
      Log.i("BBookPocMemory", row.toString())
    }
  }
  override fun definition() = ModuleDefinition {
    Name("BBookFaceAnalysis")
    Function("prepareMemoryGuard") { enabled() && memorySafe() }
    Function("instrumentationVersion") { if (enabled()) "bounded-normalizer-v1" else "disabled" }
    Function("cancelNormalization") { normalizerEpoch.incrementAndGet() }
    OnActivityEntersBackground { normalizerEpoch.incrementAndGet() }
    AsyncFunction("normalizeBounded") { uri: String, pickerWidth: Int, pickerHeight: Int, promise: Promise ->
      if (!enabled() || !memorySafe() || busy.get() || !normalizing.compareAndSet(false, true)) {
        promise.reject("E_NORMALIZER_UNAVAILABLE", "PoC normalizer is unavailable or busy", null)
        return@AsyncFunction
      }
      val id = "b${ids.incrementAndGet()}"
      val started = SystemClock.elapsedRealtime()
      val epoch = normalizerEpoch.get()
      try {
        val context = appContext.reactContext ?: error("No context")
        val result = BoundedNormalizer().normalize(context, uri, pickerWidth, pickerHeight,
          { epoch != normalizerEpoch.get() }, { stage, values ->
            mark(id, stage, started, extra = values)
            if (stage != "cleanup_requested" && !memorySafe()) throw java.util.concurrent.CancellationException()
          })
        promise.resolve(result)
      } catch (_: java.util.concurrent.CancellationException) {
        promise.reject("E_NORMALIZATION_CANCELLED", "Normalization cancelled", null)
      } catch (_: Exception) {
        promise.reject("E_NORMALIZATION_INPUT", "Unsupported, damaged or oversized image", null)
      } finally {
        normalizing.set(false)
        if (enabled()) handler.postDelayed({ mark(id, "idle_after_cleanup", started) }, 5000)
      }
    }
    Function("memoryMark") { id: String, stage: String ->
      require(id.matches(Regex("n[0-9]+")))
      require(stage in setOf("normalization_start", "normalization_end", "normalization_release"))
      mark(id, stage, normalizationStarted.getOrPut(id) { SystemClock.elapsedRealtime() })
      if (stage == "normalization_release") normalizationStarted.remove(id)
    }
    OnDestroy { normalizerEpoch.incrementAndGet(); handler.removeCallbacksAndMessages(null); normalizationStarted.clear() }
    AsyncFunction("analyze") { uri: String, promise: Promise ->
      if (!enabled() || normalizing.get() || !busy.compareAndSet(false, true)) {
        promise.reject("E_BUSY", "An analysis is already running", null)
        return@AsyncFunction
      }
      if (!memorySafe(if (acceptedAnalyses.get() > 0) 64L * 1024 else 0) || acceptedAnalyses.incrementAndGet() > 2) {
        busy.set(false)
        promise.reject("E_ADVISOR_LIMIT", "Photo advice is temporarily unavailable; use preferences", null)
        return@AsyncFunction
      }
      val requestId = "a${ids.incrementAndGet()}"
      val requestStarted = SystemClock.elapsedRealtime()
      var release: (() -> Unit)? = null
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
        release = { bitmap.recycle() }
        val image = InputImage.fromBitmap(bitmap, 0)
        val started = SystemClock.elapsedRealtime()
        val memoryBefore = Debug.getNativeHeapAllocatedSize()
        val countDetector = FaceDetection.getClient(options(false))
        created.incrementAndGet()
        release = { countDetector.close(); closed.incrementAndGet(); bitmap.recycle() }
        val contourDetector = FaceDetection.getClient(options(true))
        created.incrementAndGet()
        mark(requestId, "after_detector_creation", requestStarted)
        val finished = AtomicBoolean(false)
        fun finish() {
          if (finished.compareAndSet(false, true)) {
            mark(requestId, "before_cleanup", requestStarted)
            try { countDetector.close(); closed.incrementAndGet(); contourDetector.close(); closed.incrementAndGet() }
            finally {
              bitmap.recycle(); busy.set(false)
              mark(requestId, "cleanup_requested", requestStarted)
              // No bitmap/detector reference captured; elapsed opportunity, not proof of SDK unload.
              if (enabled()) handler.postDelayed({ mark(requestId, "idle_after_cleanup", requestStarted) }, 5000)
            }
          }
        }
        release = { finish() }
        fun fail() {
          finish()
          // Do not expose exception details, image paths, or pixels through logs/errors.
          promise.reject("E_DETECTION", "Face detection failed", null)
        }
        fun resolve(faces: List<Face>, contours: Face?) {
          val result = mapOf(
            "width" to bitmap.width, "height" to bitmap.height,
            "faceCount" to faces.size,
            "faces" to faces.map { face ->
              mapOf("box" to mapOf("x" to face.boundingBox.left, "y" to face.boundingBox.top,
                "width" to face.boundingBox.width(), "height" to face.boundingBox.height()),
                "angles" to mapOf("x" to face.headEulerAngleX, "y" to face.headEulerAngleY, "z" to face.headEulerAngleZ))
            },
            "contours" to (contours?.allContours?.map { contour ->
              mapOf("type" to contour.faceContourType, "points" to contour.points.map { mapOf("x" to it.x, "y" to it.y) })
            } ?: emptyList()),
            "latencyMs" to (SystemClock.elapsedRealtime() - started),
            "nativeHeapBeforeBytes" to memoryBefore,
            "nativeHeapAfterBytes" to Debug.getNativeHeapAllocatedSize()
          )
          finish()
          promise.resolve(result)
        }
        // Contours only report the prominent face. Count with a separate detector first.
        countDetector.process(image).addOnSuccessListener { faces ->
          mark(requestId, "after_face_count", requestStarted)
          if (!memorySafe()) fail()
          else if (faces.size != 1) resolve(faces, null)
          else contourDetector.process(image).addOnSuccessListener { detected ->
            mark(requestId, "after_contour_detection", requestStarted)
            if (!memorySafe()) fail() else resolve(faces, detected.singleOrNull())
          }.addOnFailureListener { fail() }.addOnCanceledListener { fail() }
        }.addOnFailureListener { fail() }.addOnCanceledListener { fail() }
      } catch (_: Exception) {
        runCatching { release?.invoke() }
        busy.set(false)
        promise.reject("E_INPUT", "Invalid normalized image or unavailable detector", null)
      }
    }
  }

  private fun options(contours: Boolean) = FaceDetectorOptions.Builder()
    .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
    .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_NONE)
    .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_NONE)
    .setContourMode(if (contours) FaceDetectorOptions.CONTOUR_MODE_ALL else FaceDetectorOptions.CONTOUR_MODE_NONE)
    .setMinFaceSize(0.1f)
    .build()
}
