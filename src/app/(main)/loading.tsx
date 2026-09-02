import { Skeleton } from "@/components/ui/skeleton";

export default function HomeLoading() {
  return (
    <div>
      <div className="bg-primary/5 py-14">
        <div className="mx-auto max-w-3xl space-y-4 px-4 text-center">
          <Skeleton className="mx-auto h-9 w-80" />
          <Skeleton className="mx-auto h-5 w-64" />
          <Skeleton className="mx-auto h-14 w-full" />
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <Skeleton className="h-7 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
