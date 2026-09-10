import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { landingPath, signIn } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";

export const Route = createFileRoute("/platform/admin/login")({
  beforeLoad: () => {
    if (window.localStorage.getItem("biznexus-demo-role") === "PlatformAdmin") throw redirect({ to: "/platform" });
  },
  component: PlatformAdminLoginPage,
});

function PlatformAdminLoginPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState("admin@biznexus.local");
  return <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4"><Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={toggle} aria-label="Toggle platform theme">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Card className="w-full max-w-md p-6"><div className="mb-6 flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">B</span><div><p className="font-display font-semibold">BizNexus Platform</p><p className="text-xs text-muted-foreground">Administrator console</p></div></div><h1 className="text-xl font-semibold">Platform admin sign in</h1><p className="mt-1 text-sm text-muted-foreground">Manage tenants, packages and subscriptions.</p><div className="mt-5 space-y-4"><div><Label>Email</Label><Input className="mt-1.5" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div><Label>Password</Label><Input className="mt-1.5" type="password" placeholder="Frontend demo access" /></div><Button className="w-full" disabled={!email} onClick={() => { signIn("PlatformAdmin"); void navigate({ to: landingPath("PlatformAdmin") }); }}>Sign in to platform</Button></div></Card></div>;
}
