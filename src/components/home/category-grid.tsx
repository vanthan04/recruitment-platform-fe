import Link from "next/link";
import {
  Banknote,
  Briefcase,
  Building2,
  Calculator,
  Code2,
  GraduationCap,
  HardHat,
  Headset,
  Landmark,
  Megaphone,
  Palette,
  Scale,
  Stethoscope,
  Truck,
  UsersRound,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { PATH } from "@/lib/constants/path";
import type { Category } from "@/lib/types/category";

// Categories only carry a name — this maps common Vietnamese job-category
// keywords to a representative icon, falling back to a generic briefcase.
const ICON_RULES: [RegExp, LucideIcon][] = [
  [/công nghệ|^it\b|phần mềm|lập trình/i, Code2],
  [/kinh doanh|bán hàng|sales/i, Briefcase],
  [/marketing|quảng cáo|\bpr\b/i, Megaphone],
  [/chăm sóc khách hàng|customer/i, Headset],
  [/luật|pháp lý|pháp chế/i, Scale],
  [/nhân sự|hành chính/i, UsersRound],
  [/kế toán|kiểm toán/i, Calculator],
  [/tài chính|ngân hàng|đầu tư/i, Landmark],
  [/thiết kế|sáng tạo|đồ họa/i, Palette],
  [/giáo dục|đào tạo/i, GraduationCap],
  [/y tế|dược|bệnh viện/i, Stethoscope],
  [/xây dựng|kiến trúc|bất động sản/i, Building2],
  [/vận tải|logistics|kho vận/i, Truck],
  [/nhà hàng|khách sạn|du lịch|ẩm thực/i, UtensilsCrossed],
  [/lao động phổ thông|sản xuất|công nhân/i, HardHat],
  [/thu nhập|lương/i, Banknote],
];

function iconFor(name: string): LucideIcon {
  return ICON_RULES.find(([pattern]) => pattern.test(name))?.[1] ?? Briefcase;
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {categories.map((category) => {
        const Icon = iconFor(category.name);
        return (
          <Link
            key={category.id}
            href={`${PATH.JOBS}?categoryId=${category.id}`}
            className="group border-border/60 hover:border-primary hover:bg-accent bg-card flex flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-colors"
          >
            <span className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground flex size-12 items-center justify-center rounded-xl transition-colors">
              <Icon className="size-6" />
            </span>
            <span className="line-clamp-2 text-sm font-medium">{category.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
