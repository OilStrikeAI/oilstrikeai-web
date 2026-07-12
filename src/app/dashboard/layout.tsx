import ChatWidget from "@/components/ChatWidget";
import DashboardShell from "@/components/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell>
      {children}
      <ChatWidget />
    </DashboardShell>
  );
}
