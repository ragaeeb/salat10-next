'use client';

import { ChevronsUpDown, Globe2 } from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const formatZone = (zone: string) => zone.replace(/_/g, ' ');

type TimezoneComboboxProps = { value: string; onChange: (next: string) => void; ariaLabelledBy?: string };

export function TimezoneCombobox({ value, onChange, ariaLabelledBy }: TimezoneComboboxProps) {
    const [open, setOpen] = useState(false);
    const [zones, setZones] = useState<string[]>([]);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (typeof Intl === 'undefined' || typeof (Intl as any).supportedValuesOf !== 'function') {
            setZones(['UTC']);
            return;
        }
        const supported = (Intl as any).supportedValuesOf('timeZone') as string[];
        setZones(supported);
    }, []);

    const selected = value?.trim() || 'UTC';

    const handleSelect = (zone: string) => {
        startTransition(() => {
            onChange(zone);
        });
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    type="button"
                    className={cn(
                        'flex w-full items-center justify-between rounded-xl border border-border/60 bg-card px-4 py-3 text-left font-medium text-foreground text-sm shadow-sm transition',
                        'hover:border-primary/40 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/40',
                    )}
                    aria-haspopup="listbox"
                    aria-labelledby={ariaLabelledBy}
                >
                    <span className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-primary" />
                        <span>{formatZone(selected)}</span>
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-primary" />
                </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
                <Command loop>
                    <CommandInput placeholder="Search time zones" autoFocus={true} />
                    <CommandList>
                        <CommandEmpty>No results found.</CommandEmpty>
                        <CommandGroup heading="All time zones">
                            {zones.map((zone) => (
                                <CommandItem
                                    key={zone}
                                    value={zone}
                                    onSelect={() => handleSelect(zone)}
                                    className={cn(
                                        selected === zone && 'data-[selected=true] bg-primary/10 text-foreground',
                                    )}
                                >
                                    <span>{formatZone(zone)}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                {isPending && <div className="px-3 pb-3 text-muted-foreground text-xs">Updating selection…</div>}
            </PopoverContent>
        </Popover>
    );
}
