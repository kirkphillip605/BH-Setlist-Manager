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
    <div className="overflow-x-auto">
      <table ref={tableRef} className="min-w-full divide-y divide-gray-200 shadow-sm rounded-lg overflow-hidden table-fixed dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            {columns.map((col, index) => (
              <th
                key={col.key}
                scope="col"
                className={`relative px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-300 ${col.sortable ? 'cursor-pointer' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
                style={{ width: columnWidths[col.key] }}
                onClick={col.sortable ? col.onSort : undefined}
              >
                <div className={`flex items-center ${col.align === 'right' ? 'justify-end' : ''}`}>
                  {col.header}
                </div>
                {index < columns.length - 1 && ( // Don't add resizer to the last column
                  <div
                    className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-indigo-300 opacity-0 hover:opacity-100 transition-opacity duration-100"
                    onMouseDown={(e) => startResizing(e, col.key)}
                    style={{ zIndex: 1 }}
                  />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
              {columns.map((col) => (
                <td
                  key={`${row.id || rowIndex}-${col.key}`}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.key === 'actions' ? 'font-medium' : 'text-gray-700 dark:text-gray-300'}`}
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
