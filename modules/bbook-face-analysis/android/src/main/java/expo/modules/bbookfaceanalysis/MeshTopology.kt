package expo.modules.bbookfaceanalysis

internal object MeshTopology {
  fun validCoordinates(points: List<Triple<Float, Float, Float>>, width: Int, height: Int): Boolean =
    width > 0 && height > 0 && points.size == 468 && points.all { (x, y, z) ->
      x.isFinite() && y.isFinite() && z.isFinite() && x >= 0 && y >= 0 && x <= width && y <= height
    }
  fun valid(indices: List<Int>, triangles: List<List<Int>>): Boolean =
    indices.size == 468 && indices.toSet() == (0 until 468).toSet() && triangles.isNotEmpty() &&
      triangles.all { it.size == 3 && it.toSet().size == 3 && it.all { index -> index in 0 until 468 } }
}
