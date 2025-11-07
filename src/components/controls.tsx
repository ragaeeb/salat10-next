import { ArrowLeftIcon, ChevronDownIcon, ChevronUpIcon, Settings2Icon } from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

type ControlsProps = {
    showLoadPrev: boolean;
    showLoadNext: boolean;
    handleLoadPrev: () => void;
    handleLoadNext: () => void;
};

export const Controls = ({ showLoadNext, showLoadPrev, handleLoadNext, handleLoadPrev }: ControlsProps) => {
    return (
        <>
            {showLoadPrev && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="-translate-x-1/2 absolute top-20 left-1/2 z-60"
                >
                    <Button
                        onClick={handleLoadPrev}
                        size="lg"
                        className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    >
                        <ChevronUpIcon className="mr-2 h-5 w-5" />
                        Load Previous Day
                    </Button>
                </motion.div>
            )}

            {showLoadNext && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="-translate-x-1/2 absolute bottom-20 left-1/2 z-60"
                >
                    <Button
                        onClick={handleLoadNext}
                        size="lg"
                        className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    >
                        Load Next Day
                        <ChevronDownIcon className="ml-2 h-5 w-5" />
                    </Button>
                </motion.div>
            )}

            <div className="absolute top-4 right-4 z-60 flex items-center gap-2 sm:top-6 sm:right-6">
                <Button
                    asChild
                    className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    size="sm"
                    variant="default"
                >
                    <Link href="/">
                        <ArrowLeftIcon className="mr-2 h-4 w-4" />
                        Card View
                    </Link>
                </Button>
                <Button
                    asChild
                    className="rounded-full border border-primary/30 bg-primary text-primary-foreground shadow-lg backdrop-blur-sm transition hover:bg-primary/90"
                    size="icon"
                >
                    <Link aria-label="Open settings" href="/settings">
                        <Settings2Icon className="h-5 w-5" />
                    </Link>
                </Button>
            </div>
        </>
    );
};
