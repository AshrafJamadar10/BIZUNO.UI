export type ExportValue = string | number | boolean | null | undefined;

export function downloadCsv(filename: string, headers: string[], rows: ExportValue[][]) {
  const escape = (value: ExportValue) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const content = [headers, ...rows].map((row) => row.map(escape).join(",")).join("\r\n");
  const blob = new Blob(["\ufeff", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printRecords(title: string) {
  document.title = title;
  window.print();
}
