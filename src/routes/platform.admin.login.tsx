import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getStoredRole, landingPath, signIn } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";
import { request } from "@/services/apis/client";

export const Route = createFileRoute("/platform/admin/login")({
  beforeLoad: () => {
    if (getStoredRole() === "PlatformAdmin") throw redirect({ to: "/platform" });
  },
  component: PlatformAdminLoginPage,
});

function PlatformAdminLoginPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    setSubmitting(true);
    try {
      const user = await request<Record<string, unknown>>("/bizuno/auth/login/super-admin", {
        method: "POST",
        body: JSON.stringify({ phoneOrEmail: identifier, password }),
      });
      const accessToken = typeof user.accessToken === "string" ? user.accessToken : "";
      if (!accessToken) throw new Error("Login succeeded but no access token was returned");
      signIn("PlatformAdmin", accessToken, user);
      void navigate({ to: landingPath("PlatformAdmin") });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in to BizUno platform";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4"><Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={toggle} aria-label="Toggle platform theme">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Card className="w-full max-w-md p-6"><div className="mb-6 flex items-center gap-2"><img src="/bizuno-logo.png" alt="BizUno" className="size-9 rounded-lg object-cover" /><div><p className="font-display font-semibold">BizUno Platform</p><p className="text-xs text-muted-foreground">Administrator console</p></div></div><h1 className="text-xl font-semibold">Platform admin sign in</h1><p className="mt-1 text-sm text-muted-foreground">Manage tenants, packages and subscriptions.</p><form className="mt-5 space-y-4" autoComplete="off" onSubmit={(event) => { event.preventDefault(); void handleSignIn(); }}><div><Label htmlFor="platformIdentifier">Email, phone number or username</Label><Input id="platformIdentifier" name="platformIdentifier" autoComplete="off" className="mt-1.5" type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></div><div><Label htmlFor="platformPassword">Password</Label><Input id="platformPassword" name="platformPassword" autoComplete="new-password" className="mt-1.5" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div><Button type="submit" className="w-full" disabled={!identifier || !password || submitting}>{submitting ? "Signing in..." : "Sign in to platform"}</Button></form></Card></div>;
}
