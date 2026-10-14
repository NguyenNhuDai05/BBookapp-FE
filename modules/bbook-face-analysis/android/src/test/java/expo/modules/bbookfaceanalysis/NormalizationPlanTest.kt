package expo.modules.bbookfaceanalysis
import org.junit.Assert.*
import org.junit.Test
import kotlin.math.ceil

class NormalizationPlanTest {
  @Test fun portraitLandscapeAndSmall() {
    for ((w,h) in listOf(6000 to 4000, 4000 to 6000, 960 to 1280, 800 to 600)) {
      val p=NormalizationPlan.create(w,h,1)
      assertTrue(maxOf(p.width,p.height)<=1280)
      assertTrue(ceil(w.toDouble()/p.sample)*ceil(h.toDouble()/p.sample)<=4_000_000)
      assertEquals(w.toDouble()/h,p.width.toDouble()/p.height,0.002)
    }
    assertEquals(800,NormalizationPlan.create(800,600,1).width)
  }
  @Test fun allRotationsAndMirrorsMapFourDistinctCorners() {
    val expected=listOf(0f to 0f,1f to 0f,1f to 1f,0f to 1f,0f to 0f,1f to 0f,1f to 1f,0f to 1f)
    for(o in 1..8) {
      assertEquals(expected[o-1], NormalizationPlan.point(o,0f,0f))
      val corners=listOf(0f to 0f,1f to 0f,0f to 1f,1f to 1f).map{NormalizationPlan.point(o,it.first,it.second)}
      assertEquals(4,corners.toSet().size)
      val p=NormalizationPlan.create(800,600,o)
      assertEquals(if(o>=5)600 else 800,p.width)
      assertEquals(if(o>=5)800 else 600,p.height)
    }
  }
  @Test fun invalidTooLargeAndTooThinRejected() {
    for ((w,h) in listOf(0 to 600,10000 to 10000,20001 to 128,20000 to 128)) {
      try {NormalizationPlan.create(w,h,1);fail("must reject")} catch(_:IllegalArgumentException) {}
    }
    try {NormalizationPlan.create(800,600,9);fail("invalid EXIF")} catch(_:IllegalArgumentException) {}
  }
}
