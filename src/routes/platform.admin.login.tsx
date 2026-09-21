import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { landingPath, signIn } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";
import { request } from "@/services/apis/client";

export const Route = createFileRoute("/platform/admin/login")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") === "PlatformAdmin") throw redirect({ to: "/platform" });
  },
  component: PlatformAdminLoginPage,
});

function PlatformAdminLoginPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [identifier, setIdentifier] = useState("admin@bizuno.local");
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

  return <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4"><Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={toggle} aria-label="Toggle platform theme">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Card className="w-full max-w-md p-6"><div className="mb-6 flex items-center gap-2"><img src="/bizuno-logo.png" alt="BizUno" className="size-9 rounded-lg object-cover" /><div><p className="font-display font-semibold">BizUno Platform</p><p className="text-xs text-muted-foreground">Administrator console</p></div></div><h1 className="text-xl font-semibold">Platform admin sign in</h1><p className="mt-1 text-sm text-muted-foreground">Manage tenants, packages and subscriptions.</p><div className="mt-5 space-y-4"><div><Label>Email, phone number or username</Label><Input className="mt-1.5" type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></div><div><Label>Password</Label><Input className="mt-1.5" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div><Button className="w-full" disabled={!identifier || !password || submitting} onClick={handleSignIn}>{submitting ? "Signing in..." : "Sign in to platform"}</Button></div></Card></div>;
}
