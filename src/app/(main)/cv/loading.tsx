import { Skeleton } from "@/components/ui/skeleton";

export default function CvLoading() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    </div>
  );
}
