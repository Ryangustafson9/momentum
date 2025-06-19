
import React from 'react';
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';

const isValidUUID = (uuid) => {
    if (!uuid || typeof uuid !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};

const MembershipTableContent = ({ types, visibleColumns, onEdit, onDelete, searchTerm }) => {
  if (types.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={Object.values(visibleColumns).filter(v => v).length} className="h-24 text-center">
            No memberships found.
            {searchTerm ? ` Try adjusting your search term "${searchTerm}".` : " Add a new membership to get started."}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {types.map((type) => (
        <TableRow key={type.id}>
          {visibleColumns.name && (
            <TableCell className="font-medium">
              <Badge style={{ backgroundColor: type.color || '#6366f1', color: 'white', borderColor: type.color || '#6366f1' }} className="cursor-default text-xs sm:text-sm rounded-md">
                {type.name}
              </Badge>
            </TableCell>
          )}
          {visibleColumns.category && <TableCell className="text-left">{type.category}</TableCell>}
          {visibleColumns.billing_type && <TableCell className="text-left">{type.billing_type}</TableCell>}
          {visibleColumns.price && <TableCell className="text-right">${type.price ? type.price.toFixed(2) : '0.00'}</TableCell>}
          {visibleColumns.duration_months && <TableCell className="text-left">{type.duration_months ? `${type.duration_months} mos.` : 'N/A'}</TableCell>}
          {visibleColumns.features && <TableCell className="text-xs max-w-xs truncate text-left">{Array.isArray(type.features) ? type.features.join(', ') : ''}</TableCell>}
          {visibleColumns.available_for_sale && (
            <TableCell className="text-center">
              <Badge
                variant={(type.available_for_sale !== false) ? "default" : "secondary"}
                className={`text-xs ${
                  (type.available_for_sale !== false)
                    ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800"
                    : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                }`}
              >
                {(type.available_for_sale !== false) ? "Yes" : "No"}
              </Badge>
            </TableCell>
          )}
          {visibleColumns.available_online && (
            <TableCell className="text-center">
              <Badge
                variant={type.available_online ? "default" : "secondary"}
                className={`text-xs ${
                  type.available_online
                    ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                    : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
                }`}
              >
                {type.available_online ? "Yes" : "No"}
              </Badge>
            </TableCell>
          )}
          {visibleColumns.actions && (
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onEdit(type)} className="mr-1 p-1 h-auto w-auto hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md">
                <Edit className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              </Button>
              {isValidUUID(type.id) && type.name !== 'Non-Member Access' && (
                <Button variant="ghost" size="icon" onClick={() => onDelete(type)} className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/30 p-1 h-auto w-auto rounded-md">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          )}
        </TableRow>
      ))}
    </TableBody>
  );
};

export default MembershipTableContent;


