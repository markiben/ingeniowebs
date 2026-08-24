"use client";

import { ChevronLeft } from "lucide-react";

export default function InboxMobileBack({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="plat-inbox-back"
      onClick={onClick}
      aria-label="Volver a la lista"
    >
      <ChevronLeft size={18} strokeWidth={2.25} />
    </button>
  );
}
