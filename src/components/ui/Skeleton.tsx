import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  count?: number;
  height?: string;
}

export default function Skeleton({
  className,
  count = 1,
  height = "1rem",
}: SkeletonProps) {
  return (
    <div className="space-y-2" role="status" aria-label="جاري التحميل">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "animate-pulse rounded-xl bg-gray-200 dark:bg-slate-700",
            className
          )}
          style={{ height }}
        />
      ))}
      <span className="sr-only">جاري التحميل...</span>
    </div>
  );
}
