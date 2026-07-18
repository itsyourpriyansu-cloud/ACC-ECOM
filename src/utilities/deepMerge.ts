/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export function deepMerge<T extends Record<string, unknown>, R extends Record<string, unknown>>(
  target: T,
  source: R,
): T & R {
  const output: Record<string, unknown> = { ...target }
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else if (isObject(target[key])) {
          output[key] = deepMerge(target[key], source[key])
        } else {
          Object.assign(output, { [key]: source[key] })
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }

  return output as T & R
}
