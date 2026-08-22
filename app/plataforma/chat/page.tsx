import { redirect } from "next/navigation";
import { inboxPath } from "@/lib/platform/inbox";

type Props = {
  searchParams: Promise<{ id?: string }>;
};

export default async function PlatformChatPage({ searchParams }: Props) {
  const { id } = await searchParams;
  redirect(inboxPath("chat", id));
}
