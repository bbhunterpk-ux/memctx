import path from 'path'

/**
 * Normalizes a node ID to a canonical format for consistent deduplication.
 *
 * Rules:
 * - Files: normalize path (strip ./, leading /, resolve .., lowercase)
 * - Concepts/problems/decisions: lowercase, spaces→underscores, strip punctuation
 * - Functions/classes: preserve case, strip whitespace
 */
export function normalizeNodeId(type: string, label: string): string {
  const normalizedType = type.toLowerCase()

  switch (normalizedType) {
    case 'file':
      return `file:${normalizeFilePath(label)}`

    case 'concept':
    case 'problem':
    case 'decision':
      return `${normalizedType}:${normalizeConceptLabel(label)}`

    case 'function':
    case 'class':
      return `${normalizedType}:${normalizeFunctionLabel(label)}`

    default:
      // Unknown type - use concept normalization as fallback
      return `${normalizedType}:${normalizeConceptLabel(label)}`
  }
}

/**
 * Normalize file paths to canonical form
 */
function normalizeFilePath(filePath: string): string {
  let normalized = filePath.trim()

  // Strip leading ./
  if (normalized.startsWith('./')) {
    normalized = normalized.slice(2)
  }

  // Strip leading /
  if (normalized.startsWith('/')) {
    normalized = normalized.slice(1)
  }

  // Normalize path separators and resolve .. segments
  normalized = path.normalize(normalized)

  // Convert to lowercase for case-insensitive matching
  normalized = normalized.toLowerCase()

  // Replace backslashes with forward slashes (Windows compatibility)
  normalized = normalized.replace(/\\/g, '/')

  return normalized
}

/**
 * Normalize concept/problem/decision labels
 */
function normalizeConceptLabel(label: string): string {
  return label
    .toLowerCase()
    .trim()
    // Replace spaces and hyphens with underscores
    .replace(/[\s-]+/g, '_')
    // Strip punctuation except underscores
    .replace(/[^\w_]/g, '')
    // Collapse multiple underscores
    .replace(/_+/g, '_')
    // Strip leading/trailing underscores
    .replace(/^_+|_+$/g, '')
}

/**
 * Normalize function/class labels (preserve case, strip whitespace)
 */
function normalizeFunctionLabel(label: string): string {
  return label
    .trim()
    // Collapse multiple spaces
    .replace(/\s+/g, ' ')
    // Remove special characters except alphanumeric, underscore, and space
    .replace(/[^\w\s]/g, '')
}
