import { cn } from "@/lib/utils"

interface ShimmerProps {
    className?: string;
    count?: number;
    height?: string;
}

export function Shimmer({ className, count = 1, height = "h-4" }: ShimmerProps) {
    return (
        <div className="space-y-3 w-full">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={cn(
                        "relative overflow-hidden rounded-md bg-zinc-800/50 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-zinc-700/10 before:to-transparent",
                        height,
                        className
                    )}
                />
            ))}
        </div>
    );
}
