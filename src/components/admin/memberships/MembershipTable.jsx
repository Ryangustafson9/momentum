
import React from 'react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
} from "@/components/ui/table";
import MembershipTableContent from './MembershipTableContent';

const MembershipsTableStructure = ({ columnVisibility, children, sortConfig, onSort }) => (
  <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 mx-6 mb-6">
    <Table>
      <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
        <TableRow>
          {columnVisibility.name && (
            <TableHead
              className="whitespace-nowrap text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => onSort?.('name')}
            >
              <div className="flex items-center gap-2">
                Plan Name
                {sortConfig?.key === 'name' && (
                  <span className="text-xs">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
          )}
          {columnVisibility.category && (
            <TableHead
              className="whitespace-nowrap text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => onSort?.('category')}
            >
              <div className="flex items-center gap-2">
                Category
                {sortConfig?.key === 'category' && (
                  <span className="text-xs">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
          )}
          {columnVisibility.billing_type && (
            <TableHead
              className="whitespace-nowrap text-left cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => onSort?.('billing_type')}
            >
              <div className="flex items-center gap-2">
                Billing Cycle
                {sortConfig?.key === 'billing_type' && (
                  <span className="text-xs">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
          )}
          {columnVisibility.price && (
            <TableHead
              className="text-right whitespace-nowrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              onClick={() => onSort?.('price')}
            >
              <div className="flex items-center justify-end gap-2">
                Price
                {sortConfig?.key === 'price' && (
                  <span className="text-xs">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </TableHead>
          )}
          {columnVisibility.duration_months && <TableHead className="whitespace-nowrap text-left">Duration</TableHead>}
          {columnVisibility.features && <TableHead className="whitespace-nowrap text-left">Features</TableHead>}
          {columnVisibility.role_id && <TableHead className="whitespace-nowrap text-left">Staff Role</TableHead>}
          {columnVisibility.available_for_sale && <TableHead className="text-center whitespace-nowrap">Available for Sale</TableHead>}
          {columnVisibility.available_online && <TableHead className="text-center whitespace-nowrap">Online Sale</TableHead>}
          {columnVisibility.actions && <TableHead className="text-right whitespace-nowrap">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      {children}
    </Table>
  </div>
);

const MembershipTable = ({ types, columnVisibility, onEdit, onDelete, onViewBilling, searchTerm, sortConfig, onSort }) => {
  return (
    <MembershipsTableStructure
      columnVisibility={columnVisibility}
      sortConfig={sortConfig}
      onSort={onSort}
    >
      <MembershipTableContent
        types={types}
        visibleColumns={columnVisibility}
        onEdit={onEdit}
        onDelete={onDelete}
        onViewBilling={onViewBilling}
        searchTerm={searchTerm}
      />
    </MembershipsTableStructure>
  );
};

export default MembershipTable;



