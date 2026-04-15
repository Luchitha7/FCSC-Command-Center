function escapeCell(value) {
  const raw = value == null ? '' : String(value)
  if (raw.includes('"') || raw.includes(',') || raw.includes('\n') || raw.includes('\r')) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

export function toCsv(columns, rows) {
  const header = columns.map((column) => escapeCell(column.label)).join(',')
  const body = rows
    .map((row) =>
      columns
        .map((column) => {
          const value = typeof column.getValue === 'function' ? column.getValue(row) : row[column.key]
          return escapeCell(value)
        })
        .join(','),
    )
    .join('\n')

  return body ? `${header}\n${body}` : header
}

export function downloadCsv(filename, csvContent) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
