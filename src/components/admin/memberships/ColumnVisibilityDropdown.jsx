
import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

const ColumnVisibilityDropdown = ({ columnVisibility, setColumnVisibility, allColumns, triggerButton }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {triggerButton}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.keys(allColumns).map((key) => (
          <DropdownMenuCheckboxItem
            key={key}
            className="capitalize"
            checked={columnVisibility[key]}
            onCheckedChange={() => 
              setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }))
            }
          >
            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ColumnVisibilityDropdown;



