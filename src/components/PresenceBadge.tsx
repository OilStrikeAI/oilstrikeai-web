import { presence } from "@/lib/mockData";

export default function PresenceBadge({ itemId }: { itemId: string }) {
  const info = presence.find((p) => p.itemId === itemId);
  if (!info) return null;

  const initials = info.viewer
    .split(" ")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-navy px-2 py-1 text-[10px] text-white/50">
      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gold/20 text-[9px] font-bold text-gold">
        {initials}
      </span>
      {info.viewer} viewed {info.when}
    </span>
  );
}
