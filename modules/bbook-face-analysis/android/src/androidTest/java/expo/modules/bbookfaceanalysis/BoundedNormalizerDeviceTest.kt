package expo.modules.bbookfaceanalysis

import android.test.InstrumentationTestCase
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Color
import android.graphics.Canvas
import android.graphics.Paint
import android.net.Uri
import androidx.exifinterface.media.ExifInterface
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.CancellationException

// Synthetic color quadrants only. Never selects a user's photo or runs ML Kit.
@Suppress("DEPRECATION")
class BoundedNormalizerDeviceTest : InstrumentationTestCase() {
  private fun fixture(w: Int, h: Int, orientation: Int): File {
    val f=File.createTempFile("synthetic-", ".jpg", instrumentation.targetContext.cacheDir)
    val b=Bitmap.createBitmap(w,h,Bitmap.Config.ARGB_8888)
    try {
      val canvas=Canvas(b); val paint=Paint()
      for ((i,color) in listOf(Color.RED,Color.GREEN,Color.BLUE,Color.YELLOW).withIndex()) {
        paint.color=color
        val x=(i%2)*w/2f; val y=(i/2)*h/2f
        canvas.drawRect(x,y,x+w/2f,y+h/2f,paint)
      }
      FileOutputStream(f).use { assertTrue(b.compress(Bitmap.CompressFormat.JPEG,95,it)) }
    } finally {b.recycle()}
    ExifInterface(f).apply {setAttribute(ExifInterface.TAG_ORIENTATION,orientation.toString());saveAttributes()}
    return f
  }
  fun testAllExifPixelMappingsAndCleanup() {
    for(o in 1..8) {
      val source=fixture(800,600,o)
      var output: File?=null
      try {
        val stages=mutableListOf<String>()
        val r=BoundedNormalizer().normalize(instrumentation.targetContext,Uri.fromFile(source).toString(),1,1,{false},{s,_->stages.add(s)})
        output=File(Uri.parse(r["uri"] as String).path!!)
        val b=BitmapFactory.decodeFile(output.path)
        try {
          assertEquals(if(o>=5)600 else 800,b.width);assertEquals(if(o>=5)800 else 600,b.height)
          for ((i,color) in listOf(Color.RED,Color.GREEN,Color.BLUE,Color.YELLOW).withIndex()) {
            val p=NormalizationPlan.point(o,if(i%2==0).25f else .75f,if(i/2==0).25f else .75f)
            val actual=b.getPixel((p.first*b.width).toInt(),(p.second*b.height).toInt())
            assertTrue(kotlin.math.abs(Color.red(actual)-Color.red(color))<30)
            assertTrue(kotlin.math.abs(Color.green(actual)-Color.green(color))<30)
            assertTrue(kotlin.math.abs(Color.blue(actual)-Color.blue(color))<30)
          }
        } finally {b.recycle()}
        assertEquals("cleanup_requested",stages.last())
      } finally {source.delete();output?.delete()}
    }
  }
  fun testLargeImageBoundedDecode() {
    val source=fixture(3200,2400,1);var output:File?=null;var decodedBytes=0
    try {
      val r=BoundedNormalizer().normalize(instrumentation.targetContext,Uri.fromFile(source).toString(),1,1,{false},{s,d->
        if(s=="decode_end")decodedBytes=d.getValue("bitmapBytes")
      })
      output=File(Uri.parse(r["uri"] as String).path!!)
      assertEquals(1280,r["width"]);assertEquals(960,r["height"])
      assertTrue(decodedBytes in 1..16_000_000)
    } finally {source.delete();output?.delete()}
  }
  fun testCancelAfterSaveDeletesPartialOutputAndSignalsCleanup() {
    val source=fixture(800,600,1);val directory=instrumentation.targetContext.cacheDir
    val before=directory.listFiles()!!.map{it.name}.toSet();var cancel=false;val stages=mutableListOf<String>()
    try {
      try {
        BoundedNormalizer().normalize(instrumentation.targetContext,Uri.fromFile(source).toString(),800,600,{cancel},{s,_->stages.add(s);if(s=="jpeg_save_end")cancel=true})
        fail("cancel expected")
      } catch(_:CancellationException) {}
      assertEquals("cleanup_requested",stages.last())
      assertEquals(before,directory.listFiles()!!.map{it.name}.toSet())
    } finally {source.delete()}
  }
  fun testCorruptInputStillCleansUp() {
    val source=File.createTempFile("synthetic-corrupt-", ".jpg",instrumentation.targetContext.cacheDir)
    source.writeText("not an image");val stages=mutableListOf<String>()
    try {
      try {BoundedNormalizer().normalize(instrumentation.targetContext,Uri.fromFile(source).toString(),800,600,{false},{s,_->stages.add(s)});fail("reject expected")}
      catch(_:IllegalArgumentException) {}
      assertEquals("cleanup_requested",stages.last())
    } finally {source.delete()}
  }
  fun testTelemetryFailureCannotBlockNormalizationOrCleanup() {
    val source=fixture(800,600,1);var output:File?=null
    try {
      val r=BoundedNormalizer().normalize(instrumentation.targetContext,Uri.fromFile(source).toString(),800,600,{false},{_,_->throw IllegalStateException("synthetic telemetry failure")})
      output=File(Uri.parse(r["uri"] as String).path!!)
      assertTrue(output.exists());assertEquals(800,r["width"]);assertEquals(600,r["height"])
    } finally {source.delete();output?.delete()}
  }

}
