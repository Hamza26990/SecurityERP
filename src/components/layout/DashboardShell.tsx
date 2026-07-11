import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  activePath?: string;
};

export function DashboardShell({ children, activePath }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar activePath={activePath} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
