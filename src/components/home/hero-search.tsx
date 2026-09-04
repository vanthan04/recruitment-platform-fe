import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATH } from "@/lib/constants/path";

const POPULAR_KEYWORDS = [
  "Frontend Developer",
  "Backend Developer",
  "DevOps",
  "QA/Tester",
  "Mobile Developer",
  "Data Engineer",
];

// Plain GET form — navigates to /jobs?keyword=&location= with zero client
// JS. No need for a client component just to submit a search.
export function HeroSearch() {
  return (
    <div>
      <form
        action={PATH.JOBS}
        method="get"
        className="bg-background flex flex-col gap-2 rounded-2xl p-2 shadow-xl sm:flex-row sm:items-center"
      >
        <div className="flex flex-1 items-center gap-2 pl-2">
          <Search className="text-muted-foreground size-4 shrink-0" />
          <Input
            name="keyword"
            placeholder="Vị trí, công ty, từ khóa..."
            className="h-12 flex-1 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="bg-border hidden h-8 w-px sm:block" />
        <div className="flex items-center gap-2 pl-2 sm:w-56">
          <MapPin className="text-muted-foreground size-4 shrink-0" />
          <Input
            name="location"
            placeholder="Địa điểm"
            className="h-12 border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <Button type="submit" size="lg" className="h-12 gap-2 sm:px-6">
          <Search className="size-4" />
          Tìm việc
        </Button>
      </form>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-white/70">Phổ biến:</span>
        {POPULAR_KEYWORDS.map((keyword) => (
          <Link
            key={keyword}
            href={`${PATH.JOBS}?keyword=${encodeURIComponent(keyword)}`}
            className="rounded-full border border-white/30 px-3 py-1 text-xs text-white/90 transition-colors hover:bg-white/10"
          >
            {keyword}
          </Link>
        ))}
      </div>
    </div>
  );
}
