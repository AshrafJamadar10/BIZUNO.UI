import { useState, type ChangeEvent, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TextField } from "@mui/material";

export const Route = createFileRoute("/register/")({ component: RegisterPage });

type FormState = { businessName: string; firstName: string; lastName: string; email: string; phone: string; password: string; logo: File | null };
const INITIAL: FormState = { businessName: "", firstName: "", lastName: "", email: "", phone: "", password: "", logo: null };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE = /^[+\d][\d\s().-]{6,19}$/;

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const set = (key: keyof FormState, value: string | File | null) => setForm((current) => ({ ...current, [key]: value }));
  const validate = () => {
    const next: typeof errors = {};
    if (!form.businessName.trim()) next.businessName = "Business name is required";
    else if (!/^[A-Za-z0-9 ]+$/.test(form.businessName)) next.businessName = "Use only letters, numbers and spaces";
    if (!form.firstName.trim()) next.firstName = "First name is required";
    else if (!/^[A-Za-z ]+$/.test(form.firstName)) next.firstName = "Use only letters and spaces";
    if (!form.lastName.trim()) next.lastName = "Last name is required";
    else if (!/^[A-Za-z ]+$/.test(form.lastName)) next.lastName = "Use only letters and spaces";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!EMAIL.test(form.email)) next.email = "Enter a valid email";
    if (!form.phone.trim()) next.phone = "Phone number is required";
    else if (!PHONE.test(form.phone)) next.phone = "Enter a valid phone number";
    if (!form.password) next.password = "Password is required";
    else if (form.password.length < 8) next.password = "Use at least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const submit = (event: FormEvent) => { event.preventDefault(); if (!validate()) return; toast.success("Business registration submitted"); void navigate({ to: "/login" }); };
  const logoSelected = (event: ChangeEvent<HTMLInputElement>) => set("logo", event.target.files?.[0] ?? null);

  return <div className="min-h-screen bg-muted/30 px-4 py-8"><div className="mx-auto max-w-5xl"><Link to="/landing" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to home</Link><div className="grid overflow-hidden rounded-3xl border bg-card shadow-xl lg:grid-cols-[0.8fr_1.2fr]"><div className="hidden bg-[#08111f] p-10 text-white lg:block"><div className="flex items-center gap-2"><img src="/bizuno-logo.png" alt="BizUno" className="size-9 rounded-xl object-cover" /><span className="font-display text-lg font-bold">BizUno</span></div><div className="mt-24"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Start clearly</p><h1 className="mt-4 font-display text-4xl font-bold leading-tight">Your business workspace starts here.</h1><p className="mt-5 leading-7 text-slate-300">Set up your business once, then keep sales, inventory and your team moving together.</p><ul className="mt-8 space-y-4 text-sm text-slate-300"><li className="flex gap-3"><Check className="size-5 text-emerald-300" /> One workspace for every operation</li><li className="flex gap-3"><Check className="size-5 text-emerald-300" /> Role-based access for your team</li><li className="flex gap-3"><Check className="size-5 text-emerald-300" /> Ready to scale with your business</li></ul></div></div><div className="p-6 sm:p-10"><div className="mb-8 flex items-center gap-2 lg:hidden"><img src="/bizuno-logo.png" alt="BizUno" className="size-9 rounded-lg object-cover" /><span className="font-display font-semibold">BizUno</span></div><h2 className="font-display text-2xl font-bold">Create your workspace</h2><p className="mt-2 text-sm text-muted-foreground">Register your business to get started.</p><form className="mt-7 space-y-5" onSubmit={submit} noValidate><div><TextField fullWidth size="small" label="Business name" id="businessName" value={form.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Nexus Traders" />{errors.businessName && <ErrorText text={errors.businessName} />}</div><div className="grid gap-4 sm:grid-cols-2"><Field id="firstName" label="First name" value={form.firstName} error={errors.firstName} onChange={(value) => set("firstName", value)} /><Field id="lastName" label="Last name" value={form.lastName} error={errors.lastName} onChange={(value) => set("lastName", value)} /></div><div className="grid gap-4 sm:grid-cols-2"><Field id="email" label="Email" type="email" value={form.email} error={errors.email} onChange={(value) => set("email", value)} /><Field id="phone" label="Phone number" value={form.phone} error={errors.phone} onChange={(value) => set("phone", value)} /></div><div><div className="relative"><TextField fullWidth size="small" label="Password" id="password" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 8 characters" /><button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>{errors.password && <ErrorText text={errors.password} />}</div><div><TextField fullWidth size="small" id="logo" type="file" label="Business logo (optional)" slotProps={{ htmlInput: { accept: "image/png,image/jpeg,image/svg+xml" } }} onChange={logoSelected} /></div><Button type="submit" className="h-11 w-full bg-emerald-600 hover:bg-emerald-700">Create business account</Button></form><p className="mt-6 text-center text-sm text-muted-foreground">Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link></p></div></div></div></div>;
}

function Field({ id, label, type = "text", value, error, onChange }: { id: string; label: string; type?: string; value: string; error?: string; onChange: (value: string) => void }) {
  return <div><TextField fullWidth size="small" label={label} id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} />{error && <ErrorText text={error} />}</div>;
}

function ErrorText({ text }: { text: string }) { return <p className="mt-1 text-xs text-destructive">{text}</p>; }
