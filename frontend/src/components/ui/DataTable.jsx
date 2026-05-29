import { useState } from 'react'
import React from 'react'

/**
 * DataTable — sortable, paginated table driven entirely by props.
 *
 * Props:
 *   columns     Array<{ key, label, render? }>
 *   rows        Array of data objects
 *   total       number — server-side total
 *   page        number
 *   totalPages  number
 *   onPage      (n) => void
 *   sortBy      string
 *   sortDir     'asc' | 'desc'
 *   onSort      (key) => void
 *   loading     bool
 */
export default function DataTable({
  columns, rows, total,
  page, totalPages, onPage,
  sortBy, sortDir, onSort,
  loading,
}) {
  const pageNumbers = buildPageNumbers(page, totalPages)

  return (
    <>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => onSort && onSort(col.key)}
                  title={`Sort by ${col.label}`}
                >
                  {col.label}
                  {sortBy === col.key && (
                    <span style={{ marginLeft: 4, color: 'var(--blue)' }}>
                      {sortDir === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: 20 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 20 }}>
                  No records found.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>{total.toLocaleString('en-IN')} records</span>
        <div className="pg-btns">
          <button className="pg-btn" onClick={() => onPage(1)} disabled={page === 1}>«</button>
          <button className="pg-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
          {pageNumbers.map((n, i) =>
            n === '…' ? (
              <span key={`el-${i}`} style={{ padding: '4px 6px', color: 'var(--text-muted)' }}>…</span>
            ) : (
              <button
                key={n}
                className={`pg-btn${page === n ? ' active' : ''}`}
                onClick={() => onPage(n)}
              >
                {n}
              </button>
            )
          )}
          <button className="pg-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</button>
          <button className="pg-btn" onClick={() => onPage(totalPages)} disabled={page === totalPages}>»</button>
        </div>
      </div>
    </>
  )
}

function buildPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', total)
  } else if (current >= total - 3) {
    pages.push(1, '…', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '…', current - 1, current, current + 1, '…', total)
  }
  return pages
}
