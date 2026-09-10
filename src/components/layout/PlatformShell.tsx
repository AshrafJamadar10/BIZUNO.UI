import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { BarChart3, Building2, CreditCard, LogOut, Moon, Package, Settings, Sun } from "lucide-react";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

const NAV = [{ to: "/platform", label: "Overview", icon: BarChart3 }, { to: "/platform/tenants", label: "Tenants & businesses", icon: Building2 }, { to: "/platform/subscriptions", label: "Subscriptions", icon: CreditCard }, { to: "/platform/packages", label: "Packages", icon: Package }];

export function PlatformShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  return <div className="min-h-screen bg-muted/30"><header className="border-b bg-background"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6"><Link to="/platform" className="flex items-center gap-2"><img src="/biznexus-logo.png" alt="BizNexus" className="size-8 rounded-lg object-cover" /><span className="font-display font-semibold">BizNexus Platform</span></Link><div className="flex items-center gap-2"><span className="hidden text-sm text-muted-foreground sm:inline">Platform administrator</span><Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle platform theme">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Button variant="ghost" size="icon" onClick={() => { signOut(); void navigate({ to: "/login" }); }} aria-label="Sign out"><LogOut className="size-4" /></Button></div></div></header><div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:px-6"><aside className="w-full shrink-0 md:w-56"><nav className="flex gap-1 overflow-x-auto md:flex-col">{NAV.map((item) => <Link key={item.to} to={item.to} activeProps={{ className: "bg-primary text-primary-foreground" }} className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"><item.icon className="size-4" />{item.label}</Link>)}<Link to="/platform/settings" activeProps={{ className: "bg-primary text-primary-foreground" }} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"><Settings className="size-4" />Platform settings</Link></nav></aside><main className="min-w-0 flex-1">{children}</main></div></div>;
}
