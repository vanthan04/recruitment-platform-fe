import Link from "next/link";
import { Briefcase, Globe, Mail, Phone } from "lucide-react";
import { PATH } from "@/lib/constants/path";

const CANDIDATE_LINKS = [
  { href: PATH.JOBS, label: "Tìm việc làm" },
  { href: PATH.COMPANIES, label: "Tìm công ty" },
  { href: PATH.CV_LIST, label: "Tạo CV" },
  { href: PATH.REGISTER, label: "Tạo tài khoản" },
];

const RECRUITER_LINKS = [
  { href: PATH.REGISTER, label: "Đăng ký nhà tuyển dụng" },
  { href: PATH.RECRUITER_JOBS, label: "Đăng tin tuyển dụng" },
  { href: PATH.RECRUITER_COMPANY, label: "Hồ sơ công ty" },
];

const CONTACT_ITEMS = [
  { icon: Mail, text: "support@recruitment-platform.vn" },
  { icon: Phone, text: "1900 1234" },
  { icon: Globe, text: "www.recruitment-platform.vn" },
];

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-300">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href={PATH.HOME} className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Briefcase className="size-[18px]" />
            </span>
            <span className="text-lg font-bold text-white">
              Recruitment<span className="text-primary">Platform</span>
            </span>
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-neutral-400">
            Kết nối ứng viên với nhà tuyển dụng — tìm việc nhanh, tuyển đúng người.
          </p>
        </div>

        <FooterColumn title="Dành cho ứng viên" links={CANDIDATE_LINKS} />
        <FooterColumn title="Dành cho nhà tuyển dụng" links={RECRUITER_LINKS} />

        <div>
          <h3 className="text-sm font-semibold text-white">Liên hệ</h3>
          <ul className="mt-3 space-y-2 text-sm text-neutral-400">
            {CONTACT_ITEMS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2">
                <Icon className="size-4 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} Recruitment Platform. Đã đăng ký bản quyền.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-neutral-400 transition-colors hover:text-white">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
