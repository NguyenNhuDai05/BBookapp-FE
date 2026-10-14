package expo.modules.bbookfaceanalysis
import org.junit.Assert.*
import org.junit.Test

class MeshTopologyTest {
  private val indices = (0 until 468).toList()
  private val points = List(468) { Triple(100f, 200f, -10f) }
  @Test fun acceptsBitmapCoordinatesAndRelativeNegativeZ() {
    assertTrue(MeshTopology.validCoordinates(points, 800, 1000))
  }
  @Test fun rejectsNonFiniteOrOutOfImageCoordinates() {
    for (point in listOf(Triple(Float.NaN, 200f, 0f), Triple(100f, 200f, Float.POSITIVE_INFINITY), Triple(-1f, 200f, 0f), Triple(801f, 200f, 0f), Triple(100f, 1001f, 0f)))
      assertFalse(MeshTopology.validCoordinates(points.dropLast(1) + point, 800, 1000))
  }
  @Test fun rejectsMissingPointsOrInvalidBitmapBounds() {
    assertFalse(MeshTopology.validCoordinates(points.dropLast(1), 800, 1000))
    assertFalse(MeshTopology.validCoordinates(points, 0, 1000))
  }
  @Test fun acceptsSdkIndicesIndependentOfOrder() {
    assertTrue(MeshTopology.valid(indices.reversed(), listOf(listOf(0,1,467))))
  }
  @Test fun rejectsIncompleteDuplicateAndOutOfRangeIndices() {
    for (input in listOf(indices.dropLast(1), indices.dropLast(1) + 0, indices.dropLast(1) + 468))
      assertFalse(MeshTopology.valid(input, listOf(listOf(0,1,2))))
  }
  @Test fun rejectsInvalidTopology() {
    for (triangles in listOf(emptyList(), listOf(listOf(0,1)), listOf(listOf(0,0,2)), listOf(listOf(0,1,468))))
      assertFalse(MeshTopology.valid(indices, triangles))
  }
}
