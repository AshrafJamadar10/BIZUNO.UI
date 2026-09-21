import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { landingPath, signIn, type DemoRole } from "@/lib/auth";
import { request } from "@/services/apis/client";

export const Route = createFileRoute("/login/")({
  beforeLoad: () => {
    const role = window.localStorage.getItem("bizuno-demo-role") as DemoRole | null;
    if (role === "PlatformAdmin") {
      throw redirect({ to: "/platform/admin/login" });
    }
    if (role === "Owner" || role === "Manager" || role === "Salesperson" || role === "Accountant") {
      throw redirect({ to: landingPath(role) });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [businessCode, setBusinessCode] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    setSubmitting(true);
    try {
      const user = await request<Record<string, unknown>>(`/bizuno/auth/business/${encodeURIComponent(businessCode)}/login`, {
        method: "POST",
        body: JSON.stringify({ phoneOrEmail: identifier, password }),
      });
      const accessToken = typeof user.accessToken === "string" ? user.accessToken : "";
      if (!accessToken) throw new Error("Login succeeded but no access token was returned");
      signIn("Owner", accessToken, user);
      void navigate({ to: landingPath("Owner") });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invalid credentials");
    } finally {
      setSubmitting(false);
    }
  };

  return <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4"><Card className="w-full max-w-md p-6"><div className="mb-6 flex items-center gap-2"><img src="/bizuno-logo.png" alt="BizUno" className="size-9 rounded-lg object-cover" /><div><p className="font-display font-semibold">BizUno</p><p className="text-xs text-muted-foreground">Business management workspace</p></div></div><h1 className="text-xl font-semibold">Business sign in</h1><p className="mt-1 text-sm text-muted-foreground">Sign in to your business workspace.</p><form className="mt-5 space-y-4" autoComplete="off" onSubmit={(event) => { event.preventDefault(); void handleSignIn(); }}><div><Label htmlFor="businessCode">Business code</Label><Input id="businessCode" name="businessCode" autoComplete="off" className="mt-1.5" type="text" value={businessCode} onChange={(event) => setBusinessCode(event.target.value)} /></div><div><Label htmlFor="businessIdentifier">Email, phone number or username</Label><Input id="businessIdentifier" name="businessIdentifier" autoComplete="off" className="mt-1.5" type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></div><div><Label htmlFor="businessPassword">Password</Label><Input id="businessPassword" name="businessPassword" autoComplete="new-password" className="mt-1.5" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div><Button type="submit" className="w-full" disabled={!businessCode || !identifier || !password || submitting}>{submitting ? "Signing in..." : "Sign in"}</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">New to BizUno? <Link to="/register" className="font-medium text-primary hover:underline">Create your workspace</Link></p></Card></div>;
}
