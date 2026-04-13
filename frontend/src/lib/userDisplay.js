/** Display helpers for auth user + optional profiles row */
export function displayNameFromUser(user, profile) {
  if (profile?.full_name?.trim()) return profile.full_name.trim()
  if (!user) return 'Member'
  const meta = user.user_metadata || {}
  const raw =
    meta.full_name || meta.name || meta.display_name || meta.preferred_username
  if (raw && String(raw).trim()) return String(raw).trim()
  if (user.email) {
    const local = user.email.split('@')[0]
    return local
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }
  return 'Member'
}

export function initialsFromDisplayName(displayName) {
  if (!displayName || displayName === 'Member' || displayName === '…') return '?'
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  if (displayName.length >= 2) return displayName.slice(0, 2).toUpperCase()
  return displayName[0].toUpperCase()
}

export function roleLabelFromUser(user, profile) {
  if (profile?.role?.trim()) return profile.role.trim()
  const meta = user?.user_metadata || {}
  return meta.role || meta.title || 'EC Member'
}
