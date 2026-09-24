import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  CreditCard,
  LayoutDashboard,
  Menu,
  Moon,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Tags,
  Truck,
  Globe,
  LayoutTemplate,
  Sun,
  Users,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { NotificationsMenu } from "@/components/layout/NotificationsMenu";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/inventory", label: "Inventory", icon: Boxes },
  { to: "/warehouses", label: "Warehouses", icon: Warehouse },
  { to: "/sales", label: "Sales & Invoices", icon: Receipt },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/purchases", label: "Purchases", icon: ShoppingCart },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/forms", label: "Form Handling", icon: LayoutTemplate },
  { to: "/website", label: "Website", icon: Globe },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/users", label: "Users & roles", icon: Users },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3 pb-4">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeOptions={{ exact: item.to === "/" }}
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground",
          }}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <item.icon className="size-4 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

function Brand({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-5 py-5",
        className,
      )}
    >
      <img
        src="/bizuno-logo.png"
        alt="BizUno"
        className="size-8 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 leading-tight">
        <p className="truncate font-display text-sm font-semibold text-sidebar-foreground">
          BizUno
        </p>
        <p className="truncate text-[11px] text-sidebar-foreground/60">
          Nexus Traders Pvt Ltd
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-background">
      {/* ─── Desktop sidebar ─────────────────────────────── */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4">
          <div className="rounded-xl bg-sidebar-accent/50 p-4">
            <p className="text-xs font-semibold text-sidebar-foreground">
              Growth plan
            </p>
            <p className="mt-1 text-[11px] text-sidebar-foreground/70">
              18 of 25 users · renews 12 Oct 2026
            </p>
          </div>
        </div>
      </aside>

      {/* ─── Content column ─────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* ─── Header ─────────────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-3 backdrop-blur md:h-16 md:gap-3 md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[min(18rem,85vw)] flex-col bg-sidebar p-0"
            >
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Brand />
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <GlobalSearch />
          </div>

          <div className="flex shrink-0 items-center gap-1 md:gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </Button>

            <NotificationsMenu />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full"
                  aria-label="Account menu"
                >
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      AJ
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">Ashraf Jamadar</p>
                  <p className="text-xs font-normal text-muted-foreground">
                    Workspace owner
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    signOut();
                    void navigate({ to: "/login" });
                  }}
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ─── Main content ──────────────────────────── */}
        <main className="page-enter mx-auto w-full max-w-7xl min-w-0 flex-1 px-3 pb-8 pt-4 md:px-6 md:py-8 space-y-4 md:space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}