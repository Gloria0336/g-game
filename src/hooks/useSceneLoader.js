/**
 * useSceneLoader — 動態載入場景 JSON
 *
 * 場景 JSON 統一放在 /src/data/scenes/ 下。
 * sceneId 格式：'1-1', '1-1-a', '1-2-b' 等
 * → 對應檔案：scene_1_1.json, scene_1_1_a.json, scene_1_2_b.json
 */
import { useState, useCallback } from 'react'

function sceneIdToPath(sceneId) {
  // '1-1-a' → 'scene_1_1_a'
  const normalized = sceneId.replace(/-/g, '_')
  return `/src/data/scenes/scene_${normalized}.json`
}

export function useSceneLoader() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadScene = useCallback(async (sceneId) => {
    setLoading(true)
    setError(null)
    try {
      // Vite 動態 import（dev & build 都支援）
      const module = await import(`../data/scenes/scene_${sceneId.replace(/-/g, '_')}.json`)
      setLoading(false)
      return module.default
    } catch (err) {
      setError(`找不到場景：${sceneId}`)
      setLoading(false)
      return null
    }
  }, [])

  return { loadScene, loading, error }
}
