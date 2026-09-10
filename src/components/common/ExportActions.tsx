import { FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { downloadCsv, printRecords, type ExportValue } from "@/utils/export";

interface ExportActionsProps {
  filename: string;
  headers: string[];
  rows: ExportValue[][];
}

export function ExportActions({ filename, headers, rows }: ExportActionsProps) {
  return (
    <>
      <Button variant="outline" onClick={() => downloadCsv(filename, headers, rows)} disabled={rows.length === 0}>
        <FileSpreadsheet className="size-4" /> Excel / CSV
      </Button>
      <Button variant="outline" onClick={() => printRecords(filename)}>
        <FileText className="size-4" /> PDF / Print
      </Button>
    </>
  );
}
