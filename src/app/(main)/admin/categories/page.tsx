import { getCategories } from "@/lib/services/category.service";
import { CreateCategoryForm } from "./create-category-form";
import { DeleteCategoryButton } from "./delete-category-button";
import { EditCategoryDialog } from "./edit-category-dialog";

// ADMIN-only guard lives in admin/layout.tsx.
export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold">Danh mục ngành nghề</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Danh mục dùng để lọc tin tuyển dụng. Xoá một danh mục không xoá các tin đang dùng nó — tin sẽ chỉ mất
        danh mục.
      </p>

      <div className="mb-6">
        <CreateCategoryForm />
      </div>

      <div className="space-y-3">
        {categories.map((category) => (
          <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg border p-4">
            <div>
              <p className="font-medium">{category.name}</p>
              <p className="text-muted-foreground text-xs">{category.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <EditCategoryDialog category={category} />
              <DeleteCategoryButton id={category.id} name={category.name} />
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <p className="text-muted-foreground py-10 text-center text-sm">Chưa có danh mục nào.</p>
        )}
      </div>
    </div>
  );
}
