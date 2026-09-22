import { useState } from "react";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
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
  const [identifier, setIdentifier] = useState("ashraf@bizuno.local");
  const [password, setPassword] = useState("");
  return <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4"><Card className="w-full max-w-md p-6"><div className="mb-6 flex items-center gap-2"><img src="/bizuno-logo.png" alt="BizUno" className="size-9 rounded-lg object-cover" /><div><p className="font-display font-semibold">BizUno</p><p className="text-xs text-muted-foreground">Business management workspace</p></div></div><h1 className="text-xl font-semibold">Business sign in</h1><p className="mt-1 text-sm text-muted-foreground">Sign in to your business workspace.</p><div className="mt-5 space-y-4"><div><Label>Email, phone number or username</Label><Input className="mt-1.5" type="text" value={identifier} onChange={(event) => setIdentifier(event.target.value)} /></div><div><Label>Password</Label><Input className="mt-1.5" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" /></div><Button className="w-full" disabled={!identifier || !password} onClick={() => { signIn("Owner"); void navigate({ to: landingPath("Owner") }); }}>Sign in</Button></div><p className="mt-6 text-center text-sm text-muted-foreground">New to BizUno? <Link to="/register" className="font-medium text-primary hover:underline">Create your workspace</Link></p></Card></div>;
}

// import { createFileRoute } from '@tanstack/react-router';
// import Login from '@/utils/Login';

// export const Route = createFileRoute('/login/')({
//   component: Login,
// });