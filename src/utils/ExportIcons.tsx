import {
  IconButton,
  Tooltip,
  Box,
  type IconButtonProps,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PrintIcon from "@mui/icons-material/Print";
import {
  IconFileTypeCsv,
  IconFileTypeDocx,
  IconFileTypePdf,
  IconFileTypeXls,
} from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  Table as WordTable,
  TableRow,
  TableCell,
  TextRun,
} from "docx";
import { saveAs } from "file-saver";
import { useMemo, type JSX, type ReactNode } from "react";

type Column = { key: string; label?: string; emptyValue?: string };

interface ExportIconsProps extends Omit<IconButtonProps, "onClick"> {
  data: Array<Record<string, unknown>>;
  columns?: Column[];
  filename?: string;
  iconSize?: number;
  variant?: "toolbar" | "default";
  showCopy?: boolean;
  showExcel?: boolean;
  showCSV?: boolean;
  showPDF?: boolean;
  showWord?: boolean;
  showPrint?: boolean;
  pdfTitle?: string;
  pdfOptions?: Record<string, unknown>;
}

const ExportIcons = ({
  data = [],
  columns = [],
  filename = "Export",
  iconSize = 25,
  variant = "default",
  sx,
  showCopy = true,
  showExcel = true,
  showCSV = true,
  showPDF = true,
  showPrint = true,
  showWord = true,
  pdfTitle = "Export Report",
  pdfOptions = {},
  ...iconProps
}: ExportIconsProps): JSX.Element => {
  const exportColumns = useMemo<Column[]>(() => {
    if (columns.length > 0) {
      return columns.filter(
        (c) =>
          c.key !== "actionsbuttons" &&
          c.key !== "actionbutton" &&
          c.key !== "actionsButtons",
      );
    }
    if (!data.length) return [];
    return Object.keys(data[0])
      .filter(
        (k) =>
          k !== "actionsButtons" &&
          k !== "actionbutton" &&
          k !== "actionsbuttons",
      )
      .map((k) => ({ key: k, label: k, emptyValue: "" }));
  }, [columns, data]);

  const exportData = useMemo(() => {
    const rows = data.map((item) => {
      const row: Record<string, string> = {};
      exportColumns.forEach((col) => {
        const label = col.label || col.key;
        const raw = item[col.key];
        const fallback = item[label];
        const val = raw ?? fallback;
        row[label] =
          val != null && val !== "" ? String(val) : (col.emptyValue ?? "");
      });
      return row;
    });

    const seenFooter = rows.some((r) =>
      Object.keys(r).some((k) =>
        k.toLowerCase().startsWith("footer_col_"),
      ),
    );
    if (!seenFooter) return rows;

    const mainRows = rows.filter(
      (r) =>
        !Object.keys(r).some((k) =>
          k.toLowerCase().startsWith("footer_col_"),
        ),
    );
    const footer = rows.find((r) =>
      Object.keys(r).some((k) =>
        k.toLowerCase().startsWith("footer_col_"),
      ),
    );
    return footer ? [...mainRows, footer] : rows;
  }, [data, exportColumns]);

  const isDataEmpty = exportData.length === 0;

  const notifyIfEmpty = (): boolean => {
    if (isDataEmpty) {
      alert("Data not available to export");
      return true;
    }
    return false;
  };

  const handleCopy = async (): Promise<void> => {
    if (notifyIfEmpty()) return;
    const text = [
      Object.keys(exportData[0]).join("\t"),
      ...exportData.map((r) => Object.values(r).join("\t")),
    ].join("\n");
    await navigator.clipboard.writeText(text);
    alert("Data copied to clipboard!");
  };

  const handleExcelExport = async (): Promise<void> => {
    if (notifyIfEmpty()) return;
    const XLSX = await import("xlsx");
    const wb = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(exportData);
    XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  };

  const handleCSVExport = async (): Promise<void> => {
    if (notifyIfEmpty()) return;
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.json_to_sheet(exportData);
    const blob = new Blob([XLSX.utils.sheet_to_csv(sheet)], {
      type: "text/csv",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const handlePDFExport = (): void => {
    if (notifyIfEmpty()) return;
    const doc = new jsPDF();
    autoTable(doc, {
      head: [Object.keys(exportData[0])],
      body: exportData.map((r) => Object.values(r)),
      margin: { top: 20 },
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      ...pdfOptions,
    });
    doc.text(pdfTitle, 14, 15);
    doc.save(`${filename}.pdf`);
  };

  const handleWordExport = async (): Promise<void> => {
    if (notifyIfEmpty()) return;
    const headers = Object.keys(exportData[0]);
    const rows = [
      new TableRow({
        children: headers.map(
          (h) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: h, bold: true })],
                }),
              ],
            }),
        ),
      }),
      ...exportData.map(
        (row) =>
          new TableRow({
            children: headers.map(
              (h) => new TableCell({ children: [new Paragraph(row[h])] }),
            ),
          }),
      ),
    ];

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: pdfTitle, heading: "Heading1" }),
            new WordTable({ rows }),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, `${filename}.docx`);
  };

  const handlePrint = (): void => {
    if (notifyIfEmpty()) return;
    const html = `
      <table border="1" style="width:100%; border-collapse:collapse;">
        <thead><tr>${Object.keys(exportData[0])
          .map((h) => `<th>${h}</th>`)
          .join("")}</tr></thead>
        <tbody>
          ${exportData
            .map(
              (r) =>
                `<tr>${Object.values(r)
                  .map((v) => `<td>${v}</td>`)
                  .join("")}</tr>`,
            )
            .join("")}
        </tbody>
      </table>`;
    const win = window.open("", "PrintWindow", "width=900,height=700");
    win?.document.write(
      `<html><head><title>${pdfTitle}</title></head><body>${html}</body></html>`,
    );
    win?.document.close();
    win?.print();
  };

  const isToolbar = variant === "toolbar";
  const iconSizeFinal = isToolbar ? Math.max(14, iconSize) : iconSize;
  const iconStyle = { fontSize: iconSizeFinal };

  const commonBtnSx = isToolbar
    ? {
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        px: 1.25,
        py: 0.75,
        gap: 0.75,
        ...sx,
      }
    : sx;

  const btnSize = isToolbar ? ("small" as const) : ("medium" as const);

  const btnWrapper = (
    label: string,
    onClick: () => void,
    icon: ReactNode,
    color: "success" | "warning" | "primary" | "error" | "inherit",
    key: string,
  ) => (
    <Tooltip key={key} title={label} arrow placement="top">
      <IconButton
        onClick={onClick}
        size={btnSize}
        color={color === "inherit" ? undefined : color}
        sx={commonBtnSx}
        {...iconProps}
      >
        {icon}
      </IconButton>
    </Tooltip>
  );

  return (
    <Box
      sx={{
        display: "flex",
        gap: isToolbar ? 1 : { xs: 1, sm: 2 },
        alignItems: "center",
      }}
    >
      {showExcel &&
        btnWrapper(
          "Export to Excel",
          () => void handleExcelExport(),
          <IconFileTypeXls size={iconSizeFinal} />,
          "success",
          "excel",
        )}
      {showCSV &&
        !showExcel &&
        btnWrapper(
          "Export to CSV",
          () => void handleCSVExport(),
          <IconFileTypeCsv size={iconSizeFinal} />,
          "warning",
          "csv",
        )}
      {showPDF &&
        btnWrapper(
          "Export to PDF",
          handlePDFExport,
          <IconFileTypePdf size={iconSizeFinal} />,
          "error",
          "pdf",
        )}
      {showPrint &&
        btnWrapper(
          "Print",
          handlePrint,
          <PrintIcon sx={iconStyle} />,
          "inherit",
          "print",
        )}
      {showCopy &&
        btnWrapper(
          "Copy to Clipboard",
          () => void handleCopy(),
          <ContentCopyIcon sx={iconStyle} />,
          "inherit",
          "copy",
        )}
      {showWord &&
        btnWrapper(
          "Export to Word",
          () => void handleWordExport(),
          <IconFileTypeDocx size={iconSizeFinal} />,
          "primary",
          "word",
        )}
    </Box>
  );
};

export default ExportIcons;