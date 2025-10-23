'use client';

import { ChevronsUpDown, Globe2 } from 'lucide-react';
import { useEffect, useMemo, useState, useTransition } from 'react';

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

    const selected = useMemo(() => value?.trim() || 'UTC', [value]);

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
                        'flex w-full items-center justify-between rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 text-left font-medium text-emerald-900 text-sm shadow-sm transition',
                        'hover:border-orange-300 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-200',
                    )}
                    aria-haspopup="listbox"
                    aria-labelledby={ariaLabelledBy}
                >
                    <span className="flex items-center gap-2">
                        <Globe2 className="h-4 w-4 text-emerald-500" />
                        <span>{formatZone(selected)}</span>
                    </span>
                    <ChevronsUpDown className="h-4 w-4 text-emerald-500" />
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
                                        selected === zone && 'data-[selected=true] bg-white text-emerald-900',
                                    )}
                                >
                                    <span>{formatZone(zone)}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
                {isPending && <div className="px-3 pb-3 text-emerald-500 text-xs">Updating selection…</div>}
            </PopoverContent>
        </Popover>
    );
}
