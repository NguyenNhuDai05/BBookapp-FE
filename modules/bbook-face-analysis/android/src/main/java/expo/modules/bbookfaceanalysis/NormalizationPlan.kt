package expo.modules.bbookfaceanalysis

import kotlin.math.ceil
import kotlin.math.max
import kotlin.math.roundToInt

internal data class NormalizationPlan(val sample: Int, val width: Int, val height: Int, val orientation: Int) {
  companion object {
    fun create(width: Int, height: Int, orientation: Int): NormalizationPlan {
      require(width >= 128 && height >= 128 && width <= 20000 && height <= 20000 && width.toLong() * height <= 40_000_000)
      require(orientation in 1..8)
      var sample = 1
      while (ceil(width.toDouble() / sample) * ceil(height.toDouble() / sample) > 4_000_000 ||
        max(ceil(width.toDouble() / sample), ceil(height.toDouble() / sample)) > 2560) sample *= 2
      val swapped = orientation in 5..8
      val ow = if (swapped) height else width
      val oh = if (swapped) width else height
      val scale = minOf(1.0, 1280.0 / max(ow, oh))
      val outputW = (ow * scale).roundToInt().coerceAtLeast(1)
      val outputH = (oh * scale).roundToInt().coerceAtLeast(1)
      require(minOf(outputW, outputH) >= 128)
      return NormalizationPlan(sample, outputW, outputH, orientation)
    }
    // EXIF mapping of normalized source coordinates. Used by rendering and tests.
    fun point(o: Int, x: Float, y: Float): Pair<Float, Float> = when (o) {
      1 -> x to y; 2 -> (1-x) to y; 3 -> (1-x) to (1-y); 4 -> x to (1-y)
      5 -> y to x; 6 -> (1-y) to x; 7 -> (1-y) to (1-x); 8 -> y to (1-x)
      else -> error("Unsupported orientation")
    }
  }
}
