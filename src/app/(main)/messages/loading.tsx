import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-full max-w-xs space-y-2 border-r p-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
      <div className="flex-1 space-y-3 p-4">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}
