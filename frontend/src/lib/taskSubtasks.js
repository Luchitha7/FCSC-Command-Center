const STORAGE_KEY = 'fcsc_task_subtasks_v1'

function safeParse(json) {
  try {
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function normalizeSubtasks(subtasks) {
  let source = subtasks
  if (typeof subtasks === 'string') {
    const parsed = safeParse(subtasks)
    source = Array.isArray(parsed) ? parsed : []
  }
  if (!Array.isArray(source)) return []
  return source
    .map((item, index) => {
      const title = String(item?.title || '').trim()
      if (!title) return null
      return {
        id: item?.id || `sub-${Date.now()}-${index}`,
        title,
        done: item?.done === true,
        description: String(item?.description ?? '').trim(),
      }
    })
    .filter(Boolean)
}

export function serializeSubtasksForDb(subtasks) {
  return JSON.stringify(normalizeSubtasks(subtasks))
}

function readStorageMap() {
  if (typeof window === 'undefined') return {}
  const parsed = safeParse(window.localStorage.getItem(STORAGE_KEY))
  if (!parsed || typeof parsed !== 'object') return {}
  return parsed
}

function writeStorageMap(map) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getStoredSubtasks(taskId) {
  if (!taskId) return []
  const map = readStorageMap()
  return normalizeSubtasks(map[String(taskId)] || [])
}

export function setStoredSubtasks(taskId, subtasks) {
  if (!taskId) return
  const map = readStorageMap()
  map[String(taskId)] = normalizeSubtasks(subtasks)
  writeStorageMap(map)
}

export function clearStoredSubtasks(taskId) {
  if (!taskId) return
  const map = readStorageMap()
  delete map[String(taskId)]
  writeStorageMap(map)
}

export function mergeTasksWithSubtasks(tasks) {
  return (tasks || []).map((task) => {
    // If DB returned the subtasks column (including empty/null), treat it as source of truth.
    if (Object.prototype.hasOwnProperty.call(task || {}, 'subtasks')) {
      return { ...task, subtasks: normalizeSubtasks(task?.subtasks) }
    }

    const dbSubtasks = normalizeSubtasks(task?.subtasks)
    if (dbSubtasks.length > 0) {
      return { ...task, subtasks: dbSubtasks }
    }
    return { ...task, subtasks: getStoredSubtasks(task?.id) }
  })
}
