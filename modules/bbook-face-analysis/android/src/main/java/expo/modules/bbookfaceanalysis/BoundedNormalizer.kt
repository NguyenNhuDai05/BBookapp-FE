package expo.modules.bbookfaceanalysis

import android.content.Context
import android.graphics.*
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.CancellationException

internal class BoundedNormalizer {
  fun normalize(context: Context, uri: String, pickerWidth: Int, pickerHeight: Int,
    cancelled: () -> Boolean, mark: (String, Map<String, Int>) -> Unit): Map<String, Any> {
    var source: Bitmap? = null
    var output: Bitmap? = null
    var fileOut: File? = null
    var committed = false
    fun checkCancel() { if (cancelled()) throw CancellationException() }
    fun record(stage: String, data: Map<String, Int> = emptyMap()) { mark(stage, data); checkCancel() }
    try {
      record("normalize_start", mapOf("pickerWidth" to pickerWidth, "pickerHeight" to pickerHeight))
      val parsed = Uri.parse(uri)
      require(parsed.scheme == "file")
      val file = File(parsed.path ?: error("Invalid input")).canonicalFile
      require(file.path.startsWith(context.cacheDir.canonicalPath + File.separator))
      require(file.length() in 1..(40L * 1024 * 1024))
      val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
      BitmapFactory.decodeFile(file.path, bounds)
      require(bounds.outMimeType in setOf("image/jpeg", "image/png", "image/webp"))
      val exif = ExifInterface(file)
      val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, 1).let { if (it == 0) 1 else it }
      val plan = NormalizationPlan.create(bounds.outWidth, bounds.outHeight, orientation)
      record("bounds_read", mapOf("sourceWidth" to bounds.outWidth, "sourceHeight" to bounds.outHeight,
        "sampleSize" to plan.sample, "exifOrientation" to orientation, "mirrored" to if (orientation in setOf(2,4,5,7)) 1 else 0))
      source = BitmapFactory.decodeFile(file.path, BitmapFactory.Options().apply {
        inSampleSize = plan.sample; inPreferredConfig = Bitmap.Config.ARGB_8888; inScaled = false
      }) ?: error("Decode failed")
      require(source.width <= 2560 && source.height <= 2560 && source.allocationByteCount <= 16_000_000)
      record("decode_end", mapOf("bitmapWidth" to source.width, "bitmapHeight" to source.height, "bitmapBytes" to source.allocationByteCount))
      output = Bitmap.createBitmap(plan.width, plan.height, Bitmap.Config.ARGB_8888)
      require(output.allocationByteCount <= 1280 * 1280 * 4)
      val a = NormalizationPlan.point(orientation, 0f, 0f)
      val b = NormalizationPlan.point(orientation, 1f, 0f)
      val c = NormalizationPlan.point(orientation, 0f, 1f)
      val matrix = Matrix().apply { setValues(floatArrayOf(
        (b.first-a.first)*plan.width/source.width, (c.first-a.first)*plan.width/source.height, a.first*plan.width,
        (b.second-a.second)*plan.height/source.width, (c.second-a.second)*plan.height/source.height, a.second*plan.height,
        0f,0f,1f)) }
      Canvas(output).apply { drawColor(Color.WHITE); drawBitmap(source, matrix, Paint(Paint.FILTER_BITMAP_FLAG)) }
      record("transform_end", mapOf("bitmapWidth" to output.width, "bitmapHeight" to output.height, "bitmapBytes" to output.allocationByteCount))
      source.recycle(); source = null
      fileOut = File.createTempFile("bbook-normalized-", ".jpg", context.cacheDir)
      FileOutputStream(fileOut).use { require(output.compress(Bitmap.CompressFormat.JPEG, 90, it)) }
      require(fileOut.length() in 1..(5L * 1024 * 1024))
      record("jpeg_save_end", mapOf("outputWidth" to plan.width, "outputHeight" to plan.height))
      val result = mapOf("uri" to Uri.fromFile(fileOut).toString(), "width" to plan.width, "height" to plan.height)
      checkCancel(); committed = true
      return result
    } finally {
      // Separate owned bitmaps; identity check also protects future no-transform paths.
      if (source !== output) source?.let { if (!it.isRecycled) it.recycle() }
      output?.let { if (!it.isRecycled) it.recycle() }
      if (!committed) fileOut?.delete()
      mark("cleanup_requested", emptyMap())
    }
  }
}
