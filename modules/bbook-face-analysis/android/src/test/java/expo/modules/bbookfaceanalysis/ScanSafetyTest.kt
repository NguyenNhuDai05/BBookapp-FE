package expo.modules.bbookfaceanalysis

import org.junit.Assert.*
import org.junit.Test

class ScanSafetyTest {
  @Test fun sixGrowingScansFitExpandedWarmBudgetWithoutMovingAnchor() {
    val guard = ScanMemoryGuard()
    guard.cleanedWarmIdle(sample(400))
    for (mib in listOf(400L, 435L, 470L, 505L, 540L, 575L)) {
      assertTrue("Admission at $mib MiB", guard.decide(sample(mib)).allowed)
    }
    assertEquals(400L * 1024, guard.warmedIdlePssKB)
    assertTrue(guard.decide(sample(592)).allowed)
    assertFalse(guard.decide(MemorySample(592L * 1024 + 1, false, 1024L * 1024, 128L * 1024)).allowed)
    assertEquals("system_pressure", guard.decide(sample(575, true)).reason)
    guard.cleanupComplete = false
    assertEquals("cleanup_incomplete", guard.decide(sample(575)).reason)
  }
  private fun sample(mib: Long, pressure: Boolean = false) = MemorySample(mib * 1024, pressure, 1024L * 1024, 128L * 1024)
  @Test fun coldWarmAndTenRequestsHaveNoAttemptQuota() {
    val guard = ScanMemoryGuard()
    assertTrue(guard.decide(sample(500)).allowed)
    guard.cleanedWarmIdle(sample(600))
    repeat(10) { assertTrue(guard.decide(sample(600)).allowed) }
    assertEquals(500L * 1024, guard.coldPssKB)
    assertEquals(600L * 1024, guard.warmedIdlePssKB)
  }
  @Test fun transientPeakIsNotLatchedAndWarmAnchorDoesNotDrift() {
    val guard = ScanMemoryGuard()
    guard.cleanedWarmIdle(sample(600))
    assertEquals("insufficient_budget", guard.decide(sample(740)).reason)
    assertTrue(guard.decide(sample(600)).allowed)
    guard.cleanedWarmIdle(sample(640))
    assertEquals(600L * 1024, guard.warmedIdlePssKB)
  }
  @Test fun persistentSystemPressureMustClearBeforeRecovery() {
    val guard = ScanMemoryGuard()
    repeat(10) { assertEquals("system_pressure", guard.decide(sample(500,true)).reason) }
    assertTrue(guard.decide(sample(500)).allowed)
    assertEquals("system_pressure",guard.decide(MemorySample(500L*1024,false,100,100)).reason)
  }
  @Test fun sameReserveAppliesToFirstAndSubsequentAdmission() {
    val guard = ScanMemoryGuard()
    assertEquals("insufficient_budget",guard.decide(sample(720)).reason)
    assertTrue(guard.decide(sample(700)).allowed)
    guard.cleanedWarmIdle(sample(700))
    assertEquals("insufficient_budget",guard.decide(sample(720)).reason)
  }
  @Test fun missingSamplesAndIncompleteCleanupFailClosed() {
    val guard = ScanMemoryGuard()
    assertEquals("unavailable",guard.decide(null).reason)
    guard.cleanupComplete=false
    assertEquals("cleanup_incomplete",guard.decide(sample(400)).reason)
  }
  @Test fun oneCloseFailureDoesNotSkipOtherResourcesOrBitmap() {
    val resources=ScanResources();val closed=mutableListOf<String>()
    resources.own { closed.add("bitmap") }
    resources.own { closed.add("count");error("close failure") }
    resources.own { closed.add("contour") }
    resources.own { closed.add("mesh") }
    assertEquals(1,resources.close())
    assertEquals(listOf("mesh","contour","count","bitmap"),closed)
    assertEquals(0,resources.close())
    assertEquals(4,closed.size)
  }
  @Test fun leaseRetainedUntilCleanupAndTerminalSettlesOnce() {
    val lease=ScanLease();val terminal=ScanTerminal()
    assertTrue(lease.acquire());assertFalse(lease.acquire())
    val resources=ScanResources();resources.own { assertTrue(lease.busy) }
    var outcomes=0
    repeat(3) { if(terminal.claim()){resources.close();lease.release();outcomes++} }
    assertEquals(1,outcomes);assertFalse(lease.busy);assertTrue(lease.acquire())
  }
  @Test fun measuredFourAttemptsFailForLocalReserveNotSystemPressure() {
    val guard = ScanMemoryGuard()
    for (pss in listOf(788350L,766023L,782168L,782107L)) {
      val d=guard.decide(MemorySample(pss,false,4773204,663552))
      assertEquals("insufficient_budget",d.reason)
      assertEquals(786432L,d.limitKB);assertEquals(65536L,d.headroomKB)
    }
    assertEquals(788350L,guard.coldPssKB);assertEquals(0L,guard.warmedIdlePssKB)
    assertTrue(guard.decide(MemorySample(720896,false,4773204,663552)).allowed)
    assertFalse(guard.decide(MemorySample(720897,false,4773204,663552)).allowed)
  }
  @Test fun highColdBaselineIsDiagnosticOnlyAndCannotLatchRefusal() {
    val guard=ScanMemoryGuard()
    assertFalse(guard.decide(sample(770)).allowed)
    assertTrue(guard.decide(sample(600)).allowed)
    assertEquals(770L*1024,guard.coldPssKB)
    assertEquals(0L,guard.warmedIdlePssKB)
    guard.cleanedWarmIdle(sample(600))
    assertEquals(600L*1024,guard.warmedIdlePssKB)
  }
  @Test fun invalidPssDoesNotPoisonColdDiagnosticAnchor() {
    val guard=ScanMemoryGuard()
    assertEquals("unavailable",guard.decide(MemorySample(-1,false,4000,100)).reason)
    assertEquals(0L,guard.coldPssKB)
    assertTrue(guard.decide(sample(500)).allowed)
    assertEquals(500L*1024,guard.coldPssKB)
  }
}
