import { redirect } from "next/navigation";
import { JOB_TYPE_LABEL } from "@/lib/constants/enum-label";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";
import { getCategories } from "@/lib/services/category.service";
import { getMySavedSearches } from "@/lib/services/saved-search.service";
import { DeleteSavedSearchButton } from "./delete-saved-search-button";

export default async function SavedSearchesPage() {
  const user = await getCurrentUser();
  if (!user) redirect(PATH.LOGIN);
  if (user.role !== "CANDIDATE") redirect(PATH.JOBS);

  const [savedSearches, categories] = await Promise.all([getMySavedSearches(), getCategories()]);
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Tìm kiếm đã lưu</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Bạn sẽ nhận email khi có việc làm mới phù hợp với các tìm kiếm này.
      </p>

      <div className="space-y-3">
        {savedSearches.map((savedSearch) => {
          const parts = [
            savedSearch.keyword,
            savedSearch.location,
            savedSearch.categoryId ? categoryNameById.get(savedSearch.categoryId) : undefined,
            savedSearch.jobType ? JOB_TYPE_LABEL[savedSearch.jobType] : undefined,
          ].filter(Boolean);

          return (
            <div
              key={savedSearch.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-4"
            >
              <p className="text-sm font-medium">
                {parts.length > 0 ? parts.join(" · ") : "Tất cả việc làm"}
              </p>
              <DeleteSavedSearchButton id={savedSearch.id} />
            </div>
          );
        })}
        {savedSearches.length === 0 && (
          <p className="text-muted-foreground text-sm">Bạn chưa lưu tìm kiếm nào.</p>
        )}
      </div>
    </div>
  );
}
