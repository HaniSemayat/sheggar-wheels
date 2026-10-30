/**
 * Sheggar Wheels - CSV Export Utilities
 * Handles strict RFC 4180 CSV escaping for commas, double quotes, and line breaks.
 * Fulfills 43-concept checklist item #31 and #33.
 */

/**
 * Escapes a single value according to RFC 4180 rules.
 * @param {any} val
 * @returns {string}
 */
export function escapeCSVCell(val) {
  if (val === null || val === undefined) {
    return "";
  }

  const str = String(val);

  // If cell contains commas, double quotes, or newlines, quote the field and double internal quotes
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Generates CSV string from columns and row objects, or directly from an array of row objects.
 * @param {Array<{ key: string, label: string }> | Array<object>} columnsOrRows
 * @param {Array<object>} [maybeRows]
 * @returns {string}
 */
export function generateCSV(columnsOrRows, maybeRows) {
  let columns = [];
  let rows = [];

  if (Array.isArray(columnsOrRows) && Array.isArray(maybeRows)) {
    columns = columnsOrRows;
    rows = maybeRows;
  } else if (Array.isArray(columnsOrRows)) {
    rows = columnsOrRows;
    if (rows.length > 0 && typeof rows[0] === "object" && rows[0] !== null) {
      columns = Object.keys(rows[0]).map((k) => ({ key: k, label: k }));
    }
  }

  if (columns.length === 0 || rows.length === 0) {
    return "";
  }

  const headerLine = columns.map((col) => escapeCSVCell(col.label)).join(",");
  const dataLines = rows.map((row) =>
    columns.map((col) => escapeCSVCell(row[col.key])).join(",")
  );

  return [headerLine, ...dataLines].join("\r\n");
}

/**
 * Triggers a browser download of a CSV file.
 * @param {string} filename
 * @param {string | Array<object>} data - either pre-rendered CSV string or array of objects
 */
export function downloadCSV(filename, data) {
  if (typeof window === "undefined") return;

  const csvContent = typeof data === "string" ? data : generateCSV(data);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
