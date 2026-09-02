import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PATH } from "@/lib/constants/path";

// Plain GET form — navigates to /jobs?keyword=&location= with zero client
// JS. No need for a client component just to submit a search.
export function HeroSearch() {
  return (
    <form
      action={PATH.JOBS}
      method="get"
      className="bg-background flex flex-col gap-2 rounded-xl p-2 shadow-lg sm:flex-row"
    >
      <Input
        name="keyword"
        placeholder="Vị trí, công ty, từ khóa..."
        className="h-12 flex-1 border-0 shadow-none focus-visible:ring-0"
      />
      <Input
        name="location"
        placeholder="Địa điểm"
        className="h-12 border-0 shadow-none focus-visible:ring-0 sm:w-56"
      />
      <Button type="submit" size="lg" className="h-12 gap-2">
        <Search className="size-4" />
        Tìm việc
      </Button>
    </form>
  );
}
