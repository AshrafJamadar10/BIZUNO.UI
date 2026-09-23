import { FormProvider, useForm } from "react-hook-form";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { Moon, Sun } from "lucide-react";
import { Box, Button as MuiButton } from "@mui/material";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import TextInputField from "@/components/MUI/TextInputField";
import PasswordField from "@/components/MUI/PasswordField";
import { landingPath, signIn } from "@/lib/auth";
import { useTheme } from "@/hooks/use-theme";

type PlatformLoginForm = {
  identifier: string;
  password: string;
};

export const Route = createFileRoute("/platform/login")({
  beforeLoad: () => {
    if (window.localStorage.getItem("bizuno-demo-role") === "PlatformAdmin") throw redirect({ to: "/platform" });
  },
  component: PlatformAdminLoginPage,
});

function PlatformAdminLoginPage() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const methods = useForm<PlatformLoginForm>({
    defaultValues: { identifier: "admin@bizuno.local", password: "" }
  });
  const submit = () => {
    signIn("PlatformAdmin");
    void navigate({ to: landingPath("PlatformAdmin") });
  };

  return <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4"><Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={toggle} aria-label="Toggle platform theme">{theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button><Card className="w-full max-w-md p-6"><div className="mb-6 flex items-center gap-2"><img src="/bizuno-logo.png" alt="BizUno" className="size-9 rounded-lg object-cover" /><div><p className="font-display font-semibold">BizUno Platform</p><p className="text-xs text-muted-foreground">Administrator console</p></div></div><h1 className="text-xl font-semibold">Platform admin sign in</h1><p className="mt-1 text-sm text-muted-foreground">Manage tenants, packages and subscriptions.</p><FormProvider {...methods}><Box component="form" onSubmit={methods.handleSubmit(submit)} sx={{ mt: 2 }}><TextInputField name="identifier" label="Email, phone number or username" inputType="all" required /><PasswordField name="password" label="Password" required validateStrength={false} showStrengthIndicator={false} placeholder="Enter your password" /><MuiButton type="submit" variant="contained" fullWidth disabled={!methods.watch("identifier") || !methods.watch("password")}>Sign in to platform</MuiButton></Box></FormProvider></Card></div>;
}
