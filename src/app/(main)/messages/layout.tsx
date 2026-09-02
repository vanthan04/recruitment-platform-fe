import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ChatProvider } from "@/contexts/chat-context";
import { PATH } from "@/lib/constants/path";
import { getCurrentUser } from "@/lib/services/auth.service";

export default async function MessagesLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect(`${PATH.LOGIN}?redirect=${PATH.MESSAGES}`);

  return (
    <ChatProvider currentUserId={user.id}>
      <div className="mx-auto max-w-5xl px-4 py-6">{children}</div>
    </ChatProvider>
  );
}
