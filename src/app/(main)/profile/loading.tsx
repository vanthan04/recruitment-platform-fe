import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <Skeleton className="h-16 w-16 rounded-full" />
      <Skeleton className="h-8 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}
