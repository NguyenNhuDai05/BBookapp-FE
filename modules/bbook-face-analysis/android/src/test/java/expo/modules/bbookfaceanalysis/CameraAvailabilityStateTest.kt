package expo.modules.bbookfaceanalysis
import org.junit.Assert.*
import org.junit.Test
class CameraAvailabilityStateTest {
 @Test fun initialUnknownAndReactUnmountAreNotAvailability() {
  val state=CameraAvailabilityState(setOf("front","back"))
  assertFalse(state.idle());state.update("back",true,1);assertFalse(state.idle())
  state.update("front",false,2);assertFalse(state.idle())
  state.update("front",true,4);assertTrue(state.idle())
  assertEquals(4L,state.lastAvailableMs)
  assertEquals(true,state.snapshot()["cameraAvailabilityTransitionObserved"])
 }
 @Test fun repeatOpenCloseAndUnknownIdsDoNotFakeIdle() {
  val state=CameraAvailabilityState(setOf("front"))
  state.update("other",true,1);assertFalse(state.idle())
  repeat(10){state.update("front",false,2);assertFalse(state.idle());state.update("front",true,3);assertTrue(state.idle())}
  assertFalse(state.snapshot().containsKey("front"))
 }
 @Test fun noCameraFailsClosed() { assertFalse(CameraAvailabilityState(emptySet()).idle()) }
}
