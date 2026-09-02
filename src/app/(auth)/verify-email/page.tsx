import { VerifyEmailForm } from "./verify-email-form";

interface VerifyEmailPageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { email } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Xác thực email</h1>
        <p className="text-muted-foreground text-sm">
          {email ? (
            <>
              Nhập mã xác thực đã gửi tới <span className="text-foreground font-medium">{email}</span>
            </>
          ) : (
            "Nhập mã xác thực đã gửi tới email của bạn"
          )}
        </p>
      </div>
      <VerifyEmailForm />
    </div>
  );
}
