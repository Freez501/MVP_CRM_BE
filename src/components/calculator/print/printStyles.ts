import React from "react"

export const printStyles = {
  container: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    backgroundColor: "#ffffff",
    color: "#111111",
    padding: "36px 32px",
    maxWidth: "850px",
    margin: "0 auto",
    fontSize: "12px",
    lineHeight: "1.5",
  } as React.CSSProperties,

  sectionHeader: {
    backgroundColor: "#f3f4f6",
    padding: "5px 10px",
    borderLeft: "4px solid #111111",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#111111",
    marginBottom: "8px",
  } as React.CSSProperties,

  th: {
    padding: "6px 0 8px 0",
    borderBottom: "2px solid #111111",
    fontWeight: "800",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
  } as React.CSSProperties,

  thRight: {
    padding: "6px 0 8px 0",
    borderBottom: "2px solid #111111",
    fontWeight: "800",
    fontSize: "11px",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    textAlign: "right",
  } as React.CSSProperties,

  td: {
    padding: "4px 0",
    borderBottom: "1px solid #e5e7eb",
  } as React.CSSProperties,

  tdRight: {
    padding: "4px 0",
    textAlign: "right",
    borderBottom: "1px solid #e5e7eb",
  } as React.CSSProperties,

  table: {
    width: "100%",
    fontSize: "11px",
    textAlign: "left",
    borderCollapse: "separate",
    borderSpacing: "0",
  } as React.CSSProperties,
}

export const sectionHeaderStyle = printStyles.sectionHeader
export const thStyle = printStyles.th
export const thRightStyle = printStyles.thRight
export const tdBorderBottom = { borderBottom: "1px solid #e5e7eb" } as React.CSSProperties
export const tableStyle = printStyles.table
