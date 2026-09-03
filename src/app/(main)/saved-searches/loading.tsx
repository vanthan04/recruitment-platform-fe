import { Skeleton } from "@/components/ui/skeleton";

export default function SavedSearchesLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Skeleton className="h-8 w-56" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
