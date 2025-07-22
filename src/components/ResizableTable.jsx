import React, { useState, useEffect, useRef, useCallback } from 'react';

const ResizableTable = ({ columns, data }) => {
  const [columnWidths, setColumnWidths] = useState({});
  const tableRef = useRef(null);
  const isResizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(0);
  const currentColumnKey = useRef(null);

  // Initialize column widths on mount or when columns change
  useEffect(() => {
    const initialWidths = {};
    columns.forEach(col => {
      initialWidths[col.key] = col.initialWidth || 150; // Default width if not provided
    });
    setColumnWidths(initialWidths);
  }, [columns]);

  // Define resize and stopResizing BEFORE startResizing
  // This ensures they are initialized when startResizing's useCallback is evaluated.
  const resize = useCallback((e) => {
    if (!isResizing.current) return;

    const deltaX = e.clientX - startX.current;
    const newWidth = Math.max(50, startWidth.current + deltaX); // Minimum column width of 50px

    setColumnWidths(prevWidths => ({
      ...prevWidths,
      [currentColumnKey.current]: newWidth,
    }));
  }, []); // Dependencies are empty because it relies on stable refs' .current values and a stable state setter.

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResizing); // This is fine as stopResizing itself is a stable reference
    document.body.style.cursor = 'default'; // Reset cursor
    document.body.style.userSelect = 'auto'; // Reset user-select
    currentColumnKey.current = null;
  }, [resize]); // Only 'resize' is a dependency here. Removed 'stopResizing' to break circular dependency.

  const startResizing = useCallback((e, key) => {
    isResizing.current = true;
    startX.current = e.clientX;
    currentColumnKey.current = key;
    startWidth.current = columnWidths[key];

    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize'; // Change cursor globally during resize
    document.body.style.userSelect = 'none'; // Prevent text selection during resize
  }, [columnWidths, resize, stopResizing]); // Now resize and stopResizing are guaranteed to be defined.

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table ref={tableRef} className="min-w-full divide-y divide-zinc-700 table-fixed">
        <thead className="bg-zinc-800 border-b border-zinc-700">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key}
                scope="col"
                className={`relative px-4 sm:px-6 py-3 text-left text-xs font-medium text-zinc-300 uppercase tracking-wider ${col.sortable ? 'cursor-pointer hover:bg-zinc-700' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                style={{ width: columnWidths[col.key] }}
                onClick={col.sortable ? col.onSort : undefined}
              >
                <div className={`flex items-center ${col.align === 'right' ? 'justify-end' : ''}`}>
                  {col.header}
                </div>
                {index < columns.length - 1 && ( // Don't add resizer to the last column
                  <div
                    className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-300 opacity-0 hover:opacity-100 transition-opacity duration-100"
                    onMouseDown={(e) => startResizing(e, col.key)}
                    style={{ zIndex: 1 }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-zinc-800 divide-y divide-zinc-700">
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="hover:bg-zinc-700 transition-colors">
              {columns.map((col) => (
                <td
                  key={`${row.id || rowIndex}-${col.key}`}
                  className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.key === 'actions' ? 'font-medium' : 'text-zinc-300'}`}
                  style={{ width: columnWidths[col.key] }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResizableTable;