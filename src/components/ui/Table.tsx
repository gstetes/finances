import { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TableProps extends TableHTMLAttributes<HTMLTableElement> {}

export function Table({ className, children, ...props }: TableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
      <table className={cn('w-full text-sm', className)} {...props}>
        {children}
      </table>
    </div>
  )
}

Table.Head = function TableHead({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={cn('border-b border-gray-200 bg-gray-50', className)} {...props}>
      {children}
    </thead>
  )
}

Table.Body = function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn('divide-y divide-gray-100 bg-white', className)} {...props}>
      {children}
    </tbody>
  )
}

export interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
  onClick?: () => void
}

Table.Row = function TableRow({ className, onClick, children, ...props }: TableRowProps) {
  return (
    <tr
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-gray-50',
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </tr>
  )
}

Table.Th = function TableTh({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500', className)}
      {...props}
    >
      {children}
    </th>
  )
}

Table.Td = function TableTd({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={cn('px-4 py-3 text-gray-700', className)} {...props}>
      {children}
    </td>
  )
}

export interface TableEmptyProps {
  colSpan?: number
  message?: string
}

Table.Empty = function TableEmpty({ colSpan, message = 'Nenhum item encontrado.' }: TableEmptyProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-10 text-center text-sm text-gray-400">
        {message}
      </td>
    </tr>
  )
}
