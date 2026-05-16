/**
 * Utility function for client-side CSV export
 * No external dependencies required
 */

type CSVValue = string | number | boolean | null | undefined

interface CSVRow {
  [key: string]: CSVValue
}

/**
 * Escapes a CSV value by wrapping in quotes if it contains special characters
 */
function escapeCSVValue(value: CSVValue): string {
  if (value === null || value === undefined) {
    return ''
  }
  
  const stringValue = String(value)
  
  // If the value contains comma, quote, or newline, wrap it in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape existing quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  
  return stringValue
}

/**
 * Converts an array of objects to CSV string
 */
function convertToCSV(rows: CSVRow[]): string {
  if (rows.length === 0) {
    return ''
  }
  
  // Get headers from the first row
  const headers = Object.keys(rows[0])
  
  // Create header row
  const headerRow = headers.map(escapeCSVValue).join(',')
  
  // Create data rows
  const dataRows = rows.map(row => {
    return headers.map(header => escapeCSVValue(row[header])).join(',')
  })
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n')
}

/**
 * Downloads data as a CSV file
 * @param filename - The name of the file to download (should include .csv extension)
 * @param rows - Array of objects where keys are column headers
 */
export function downloadCSV(filename: string, rows: CSVRow[]): void {
  // Convert data to CSV string
  const csvContent = convertToCSV(rows)
  
  // Create a Blob with the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Create a temporary URL for the Blob
  const url = URL.createObjectURL(blob)
  
  // Create a temporary anchor element to trigger download
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  // Add to DOM, click, and remove
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the URL object
  URL.revokeObjectURL(url)
}

/**
 * Formats data for audit trail export
 */
export function formatAuditLogsForExport(logs: {
  auditId: string
  employeeName: string
  goalTitle: string
  fieldChanged: string
  oldValue: string
  newValue: string
  changedBy: string
  changedByRole: string
  actionType: string
  timestamp: string
}[]): CSVRow[] {
  return logs.map(log => ({
    'Audit ID': log.auditId,
    'Employee': log.employeeName,
    'Goal': log.goalTitle,
    'Field Changed': log.fieldChanged,
    'Old Value': log.oldValue,
    'New Value': log.newValue,
    'Changed By': log.changedBy,
    'Role': log.changedByRole,
    'Action': log.actionType,
    'Timestamp': new Date(log.timestamp).toLocaleString(),
  }))
}

/**
 * Formats data for report export
 */
export function formatReportDataForExport(reports: {
  employeeName: string
  department: string
  managerName: string
  goalTitle: string
  thrustArea: string
  plannedTarget: number
  actualAchievement: number | null
  weightage: number
  score: number | null
  quarter: string
  status: string
}[]): CSVRow[] {
  return reports.map(report => ({
    'Employee': report.employeeName,
    'Department': report.department,
    'Manager': report.managerName,
    'Goal Title': report.goalTitle,
    'Thrust Area': report.thrustArea,
    'Planned Target': report.plannedTarget,
    'Actual Achievement': report.actualAchievement ?? 'N/A',
    'Weightage (%)': report.weightage,
    'Score (%)': report.score ?? 'N/A',
    'Quarter': report.quarter,
    'Status': report.status,
  }))
}
