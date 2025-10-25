import * as React from 'react';

import { cn } from '@/lib/utils';

type TableProps = React.TableHTMLAttributes<HTMLTableElement>;

type TableSectionProps<T extends HTMLElement> = React.HTMLAttributes<T> & { asChild?: boolean };

type TableRowProps = React.HTMLAttributes<HTMLTableRowElement> & { asChild?: boolean };

type TableCellProps = React.TdHTMLAttributes<HTMLTableCellElement> & { asChild?: boolean };

type TableHeaderCellProps = React.ThHTMLAttributes<HTMLTableCellElement> & { asChild?: boolean };

export const Table = React.forwardRef<HTMLTableElement, TableProps>(({ className, ...props }, ref) => (
    <div className="w-full overflow-auto">
        <table
            ref={ref}
            className={cn('w-full caption-bottom text-sm text-foreground', className)}
            {...props}
        />
    </div>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, TableSectionProps<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />,
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, TableSectionProps<HTMLTableSectionElement>>(
    ({ className, ...props }, ref) => <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />,
);
TableBody.displayName = 'TableBody';

export const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className, ...props }, ref) => (
        <tr
            ref={ref}
            className={cn('border-b border-border/60 transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
            {...props}
        />
    ),
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, TableHeaderCellProps>(
    ({ className, ...props }, ref) => (
        <th
            ref={ref}
            className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)}
            {...props}
        />
    ),
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className, ...props }, ref) => (
        <td ref={ref} className={cn('p-4 align-middle text-sm', className)} {...props} />
    ),
);
TableCell.displayName = 'TableCell';

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, TableSectionProps<HTMLTableCaptionElement>>(
    ({ className, ...props }, ref) => <caption ref={ref} className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />,
);
TableCaption.displayName = 'TableCaption';
