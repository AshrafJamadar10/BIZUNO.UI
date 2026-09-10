import { useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { landingPath, signIn, type DemoRole } from "@/lib/auth";

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
  const [email, setEmail] = useState("ashraf@bizuno.local");
  const [role, setRole] = useState<DemoRole>("Owner");
  return <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4"><Card className="w-full max-w-md p-6"><div className="mb-6 flex items-center gap-2"><img src="/bizuno-logo.png" alt="BizUno" className="size-9 rounded-lg object-cover" /><div><p className="font-display font-semibold">BizUno</p><p className="text-xs text-muted-foreground">Business management workspace</p></div></div><h1 className="text-xl font-semibold">Business sign in</h1><p className="mt-1 text-sm text-muted-foreground">Sign in to your business workspace.</p><div className="mt-5 space-y-4"><div><Label>Email</Label><Input className="mt-1.5" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div><Label>Workspace role</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={role} onChange={(event) => setRole(event.target.value as DemoRole)}><option>Owner</option><option>Manager</option><option>Salesperson</option><option>Accountant</option></select></div><Button className="w-full" disabled={!email} onClick={() => { signIn(role); void navigate({ to: landingPath(role) }); }}>Continue as {role}</Button></div></Card></div>;
}
