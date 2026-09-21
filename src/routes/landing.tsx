import { ArrowRight, BarChart3, Check, ChevronDown, Menu, Package, Receipt, ShieldCheck, Sparkles } from "lucide-react";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/landing")({ component: LandingPage });

function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#08111f] text-white">
      <header className="sticky top-0 z-30 border-b border-white/[0.07] bg-[#08111f]/95 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-6 px-5 lg:px-8">
          <Link to="/landing" className="flex shrink-0 items-center gap-3">
            <img src="/bizuno-logo.png" alt="BizUno" className="size-10 rounded-xl object-cover ring-1 ring-white/20" />
            <span className="font-display text-xl font-bold tracking-tight">BizUno</span>
          </Link>
          <nav className="hidden flex-1 items-center justify-center gap-8 text-[15px] font-medium lg:flex">
            <a href="#how-it-works" className="text-slate-300 transition-colors hover:text-white">How it works</a>
            <a href="#pricing" className="text-slate-300 transition-colors hover:text-white">Pricing</a>
            <a href="#features" className="text-slate-300 transition-colors hover:text-white">Features</a>
            <a href="#product-tour" className="text-violet-300 transition-colors hover:text-violet-200">Product tour</a>
            <a href="#resources" className="flex items-center gap-1 text-violet-300 transition-colors hover:text-violet-200">Resources <ChevronDown className="size-3.5" /></a>
          </nav>
          <div className="hidden shrink-0 items-center gap-4 sm:flex">
            <Button asChild variant="ghost" className="text-[15px] font-semibold text-white hover:bg-white/10 hover:text-white"><Link to="/login">Login</Link></Button>
            <Button asChild variant="outline" className="h-11 rounded-xl border-white/20 bg-white/[0.03] px-6 text-[15px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:border-violet-300/60 hover:bg-violet-400/10 hover:text-white"><Link to="/register">Get started <ArrowRight className="size-4" /></Link></Button>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 sm:hidden" aria-label="Open navigation"><Menu className="size-5" /></Button>
        </div>
      </header>

      <main>
        <section className="relative mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8 lg:pb-32 lg:pt-24">
          <div className="absolute -left-40 top-0 size-[30rem] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative">
            <div className="rise-in mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-medium text-emerald-200"><Sparkles className="size-3.5" /> Business operations, simplified</div>
            <h1 className="rise-in max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-tight [animation-delay:100ms] sm:text-6xl lg:text-7xl">Run your business with <span className="text-emerald-300">clarity.</span></h1>
            <p className="rise-in mt-6 max-w-xl text-base leading-7 text-slate-300 [animation-delay:180ms] sm:text-lg">BizUno brings sales, inventory, purchasing, payments and people together in one calm, powerful workspace.</p>
            <div className="rise-in mt-8 flex flex-wrap gap-3 [animation-delay:260ms]"><Button asChild size="lg" className="bg-emerald-400 px-6 text-slate-950 transition-transform hover:-translate-y-1 hover:bg-emerald-300"><Link to="/register">Start for free <ArrowRight className="size-4" /></Link></Button><Button asChild size="lg" variant="outline" className="border-white/20 bg-white/5 text-white transition-transform hover:-translate-y-1 hover:bg-white/10 hover:text-white"><Link to="/login">Explore workspace</Link></Button></div>
            <div className="rise-in mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 [animation-delay:340ms]"><span className="flex items-center gap-2"><Check className="size-4 text-emerald-300" /> No credit card required</span><span className="flex items-center gap-2"><Check className="size-4 text-emerald-300" /> Built for growing teams</span></div>
          </div>
          <div className="relative">
            <div className="absolute -inset-5 rounded-[2rem] bg-emerald-400/10 blur-2xl" />
            <div className="float-slow relative rounded-2xl border border-white/10 bg-white/[0.07] p-3 shadow-2xl shadow-black/30 backdrop-blur">
              <div className="rounded-xl border border-white/10 bg-[#101d2e] p-5">
                <div className="flex items-center justify-between"><div><p className="text-xs text-slate-400">Workspace overview</p><p className="mt-1 text-xl font-semibold">Good morning, Ashraf</p></div><div className="size-2 rounded-full bg-emerald-400" /></div>
                <div className="mt-6 grid grid-cols-2 gap-3"><PreviewMetric label="Revenue" value="₹12.84L" change="+18.4%" /><PreviewMetric label="Outstanding" value="₹2.16L" change="-6.2%" /></div>
                <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"><div className="mb-4 flex items-center justify-between text-xs text-slate-400"><span>Revenue trend</span><span className="text-emerald-300">This month</span></div><div className="flex h-28 items-end gap-2">{[35, 48, 42, 68, 57, 79, 92, 74, 100, 86, 108, 96].map((height, index) => <div key={index} className="flex-1 rounded-t bg-gradient-to-t from-emerald-500/30 to-emerald-300" style={{ height: `${height}%` }} />)}</div></div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs"><PreviewPill icon={Receipt} label="Sales" value="128" /><PreviewPill icon={Package} label="Products" value="246" /><PreviewPill icon={BarChart3} label="Reports" value="24" /></div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-white/10 bg-white/[0.03] px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Everything in one place</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Less chasing. More doing.</h2><p className="mt-4 text-slate-400">Replace scattered spreadsheets and disconnected tools with one source of truth for your business.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3"><Feature icon={BarChart3} title="Know your numbers" text="See revenue, receivables and performance trends at a glance." /><Feature icon={Package} title="Stay in control" text="Manage products, stock, warehouses and purchasing without guesswork." /><Feature icon={ShieldCheck} title="Grow with confidence" text="Give your team the right access and keep every workflow organised." /></div></div></section>
        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-20 lg:px-8"><div className="grid gap-8 md:grid-cols-3">{["Create your workspace", "Bring your operations together", "Make better decisions"].map((title, index) => <div key={title} className="flex gap-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-300 font-semibold text-slate-950">{index + 1}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{["Register your business in under a minute.", "Connect products, customers, sales and inventory.", "Use live insights to move your business forward."][index]}</p></div></div>)}</div></section>
        <div id="product-tour"><ProductShowcase /></div>
        <Pricing />
        <Testimonials />
      </main>
      <footer id="resources" className="border-t border-white/10 px-5 py-8 text-sm text-slate-500 lg:px-8"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row"><span>© 2026 BizUno. Business, made clearer.</span><span>Simple tools for ambitious businesses.</span></div></footer>
    </div>
  );
}

function PreviewMetric({ label, value, change }: { label: string; value: string; change: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-2 text-lg font-semibold">{value}</p><p className="mt-1 text-xs text-emerald-300">{change}</p></div>;
}

function PreviewPill({ icon: Icon, label, value }: { icon: typeof Receipt; label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2"><Icon className="mx-auto size-4 text-emerald-300" /><p className="mt-1 text-slate-400">{label}</p><p className="mt-0.5 font-semibold text-white">{value}</p></div>;
}

function Feature({ icon: Icon, title, text }: { icon: typeof BarChart3; title: string; text: string }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"><Icon className="size-6 text-emerald-300" /><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{text}</p></div>;
}

function ProductShowcase() {
  return <section className="px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">See BizUno in action</p><h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Screens built around the work you do.</h2><p className="mt-4 text-slate-400">These previews show how each page helps your team act faster, keep records accurate and understand the business at a glance.</p></div><div className="mt-12 space-y-10"><ShowcaseRow title="Dashboard" text="Understand revenue, receivables, payment status and low-stock products immediately after signing in." badge="Make decisions faster" reverse={false}><DashboardPreview /></ShowcaseRow><ShowcaseRow title="Inventory and warehouses" text="Know exactly what quantity you have, where it is stored and what needs attention. Update warehouse assignments and quantities without leaving Inventory." badge="Prevent stock surprises" reverse><InventoryPreview /></ShowcaseRow><ShowcaseRow title="Sales, purchases and payments" text="Create invoices, follow purchase orders and record payments in connected workflows so your financial records stay current." badge="Keep cash moving" reverse={false}><SalesPreview /></ShowcaseRow></div></div></section>;
}

function ShowcaseRow({ title, text, badge, reverse, children }: { title: string; text: string; badge: string; reverse: boolean; children: ReactNode }) {
  return <div className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[&>*:first-child]:order-2" : ""}`}><div><span className="inline-flex rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-medium text-emerald-200">{badge}</span><h3 className="mt-4 font-display text-2xl font-bold">{title}</h3><p className="mt-3 max-w-lg leading-7 text-slate-400">{text}</p></div><div className="rise-in">{children}</div></div>;
}

function PreviewFrame({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-white/10 bg-[#101d2e] p-2 shadow-2xl shadow-black/30 transition-transform duration-500 hover:-translate-y-2"><div className="flex items-center gap-1 border-b border-white/10 px-3 py-2"><span className="size-2 rounded-full bg-rose-400/80" /><span className="size-2 rounded-full bg-amber-300/80" /><span className="size-2 rounded-full bg-emerald-400/80" /><span className="ml-3 text-[10px] text-slate-500">app.bizuno.com</span></div><div className="rounded-b-xl bg-slate-50 p-4 text-slate-900">{children}</div></div>;
}

function DashboardPreview() {
  return <PreviewFrame><div className="flex items-center justify-between"><div><p className="text-[10px] text-slate-500">DASHBOARD</p><p className="mt-1 text-lg font-bold">Good morning, Ashraf</p></div><span className="rounded bg-emerald-100 px-2 py-1 text-[10px] text-emerald-700">This month</span></div><div className="mt-4 grid grid-cols-3 gap-2"><MiniStat label="Revenue" value="₹12.84L" /><MiniStat label="Invoices" value="128" /><MiniStat label="Stock value" value="₹8.2L" /></div><div className="mt-3 flex h-24 items-end gap-1 rounded-lg bg-slate-100 p-3">{[28, 40, 35, 55, 48, 68, 62, 84, 74, 92, 81, 100].map((height, index) => <div key={index} className="flex-1 rounded-t bg-indigo-500" style={{ height: `${height}%` }} />)}</div></PreviewFrame>;
}

function InventoryPreview() {
  return <PreviewFrame><div className="flex items-center justify-between"><p className="text-lg font-bold">Inventory</p><span className="rounded bg-indigo-100 px-2 py-1 text-[10px] text-indigo-700">Edit stock</span></div><div className="mt-4 overflow-hidden rounded-lg border text-xs"><div className="grid grid-cols-4 bg-slate-100 p-2 font-semibold"><span>Product</span><span>Warehouse</span><span>Quantity</span><span>Status</span></div>{[["MacBook Air", "Andheri", "24", "Healthy"], ["HP ProBook", "Whitefield", "4", "Low stock"], ["Anker Charger", "Andheri", "120", "Healthy"]].map((row) => <div key={row[0]} className="grid grid-cols-4 border-t p-2"><span>{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span className="text-emerald-600">{row[3]}</span></div>)}</div></PreviewFrame>;
}

function SalesPreview() {
  return <PreviewFrame><div className="flex items-center justify-between"><p className="text-lg font-bold">Sales & invoices</p><span className="rounded bg-emerald-100 px-2 py-1 text-[10px] text-emerald-700">+ New invoice</span></div><div className="mt-4 space-y-2 text-xs">{[["INV-2026-0184", "Nexus Retail", "₹84,900", "Paid"], ["INV-2026-0183", "Orbit Systems", "₹42,500", "Pending"], ["PO-2026-0041", "TechSource", "₹6.42L", "Ordered"]].map((row) => <div key={row[0]} className="grid grid-cols-4 items-center rounded-lg border p-2"><span className="font-semibold">{row[0]}</span><span>{row[1]}</span><span>{row[2]}</span><span className="text-emerald-600">{row[3]}</span></div>)}</div></PreviewFrame>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg bg-slate-100 p-2"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-1 text-sm font-bold">{value}</p></div>;
}

function Pricing() {
  return <section id="pricing" className="border-y border-white/10 bg-[#0d141c] px-5 py-20 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mx-auto max-w-2xl text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Simple pricing</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Try every BizUno workflow free for 3 months.</h2><p className="mt-4 text-slate-400">Use the full workspace, invite your team and see how BizUno fits your business before choosing a plan.</p></div><div className="mt-10 grid gap-5 lg:grid-cols-3"><Plan name="Starter" price="₹0" description="For exploring the workspace" items={["Products and categories", "Customers and suppliers", "Basic dashboard"]} /><Plan name="Growth" price="₹999" description="For growing business teams" items={["Unlimited sales and invoices", "Inventory and warehouses", "Purchases and payments", "Reports and team roles"]} popular /><Plan name="Scale" price="Custom" description="For complex operations" items={["Advanced permissions", "Multi-team workflows", "Priority onboarding", "Custom support"]} /></div><div className="mt-8 rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-5 text-center"><p className="font-semibold text-emerald-100">Your first 3 months are free</p><p className="mt-1 text-sm text-emerald-100/70">No payment required to start. After the trial, choose the plan that matches your business.</p></div></div></section>;
}

function Plan({ name, price, description, items, popular = false }: { name: string; price: string; description: string; items: string[]; popular?: boolean }) {
  return <div className={`relative rounded-2xl border p-6 ${popular ? "border-indigo-400 bg-indigo-500/10 shadow-xl shadow-indigo-950/30" : "border-white/10 bg-white/[0.04]"}`}>{popular && <span className="absolute -top-3 left-6 rounded-full bg-indigo-500 px-3 py-1 text-xs font-semibold">Most popular</span>}<h3 className="text-xl font-semibold">{name}</h3><p className="mt-2 text-sm text-slate-400">{description}</p><p className="mt-6 text-3xl font-bold">{price}{price !== "Custom" && <span className="text-sm font-normal text-slate-400"> / month</span>}</p><ul className="mt-6 space-y-3 text-sm text-slate-300">{items.map((item) => <li key={item} className="flex gap-2"><Check className="size-4 shrink-0 text-emerald-300" />{item}</li>)}</ul><Button asChild className={`mt-8 w-full ${popular ? "bg-indigo-500 hover:bg-indigo-400" : "bg-white/10 hover:bg-white/20"}`}><Link to="/register">Start 3-month trial</Link></Button></div>;
}

function Testimonials() {
  return (
    <section className="border-t border-white/10 bg-[#0d141c] px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Loved by operators</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">A clearer way to move work forward.</h2>
          <p className="mt-4 text-slate-400">Real workflows feel better when every number, order and customer is in one place.</p>
        </div>
        <div className="mt-12 grid items-start gap-5 md:grid-cols-3">
          <div className="space-y-5 md:pt-12">
            <TestimonialCard initials="SW" name="Sarah Wilson" meta="Operations lead · 42 reviews" text="BizUno gave our team one calm place to manage sales, stock and follow-ups. We stopped chasing updates across spreadsheets." color="bg-rose-500" delay="0ms" />
            <TestimonialCard initials="MB" name="Mike Barnes" meta="Owner · Retail business" text="Simple enough for the whole team, powerful enough for the numbers I need every morning." color="bg-amber-100 text-slate-800" delay="180ms" />
          </div>
          <div className="space-y-5">
            <TestimonialCard initials="EK" name="Emily Kim" meta="@emilykim · Verified business" text="The dashboard is clear, the workflows are fast, and I always know what needs attention next." color="bg-sky-500" delay="260ms" />
            <div className="rounded-2xl border border-emerald-300/50 bg-emerald-700/80 p-6 shadow-xl shadow-emerald-950/30 transition-transform duration-500 hover:-translate-y-2">
              <div className="flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-full bg-emerald-400/30 font-semibold">AT</div><div><p className="font-semibold">Alex Thompson</p><p className="text-sm text-emerald-100/70">online now</p></div></div>
              <div className="mt-7 rounded-xl bg-white p-4 text-slate-800 shadow-lg"><p className="text-sm leading-6">“We finally have a reliable view of our business. The team knows exactly what to do next.”</p><p className="mt-4 text-right text-xs text-slate-400">BizUno workspace · 12:30 PM</p></div>
            </div>
          </div>
          <div className="space-y-5 md:pt-4">
            <TestimonialCard initials="AM" name="Alex Martinez" meta="Product manager · Growing team" text="The automation helped us spend less time collecting data and more time acting on it. Decent analytics too." color="bg-indigo-500" delay="120ms" quote />
            <TestimonialCard initials="RT" name="Rachel Thompson" meta="Product manager at StartupCo" text="Inventory, purchasing and payments now feel like one connected workflow." color="bg-blue-600" delay="320ms" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ initials, name, meta, text, color, delay, quote = false }: { initials: string; name: string; meta: string; text: string; color: string; delay: string; quote?: boolean }) {
  return <article className={`rise-in rounded-2xl border border-slate-200/10 bg-slate-50 p-6 text-slate-900 shadow-xl shadow-black/10 transition-transform duration-500 hover:-translate-y-2 ${quote ? "italic" : ""}`} style={{ animationDelay: delay }}>
    <div className="flex items-center gap-3"><div className={`flex size-12 items-center justify-center rounded-full text-lg font-medium text-white ${color}`}>{initials}</div><div><p className="font-semibold">{name}</p><p className="text-sm text-slate-500">{meta}</p></div></div>
    <div className="mt-5 flex gap-1 text-amber-400" aria-label="5 out of 5 stars">{"★★★★★"}</div>
    <p className="mt-4 text-[15px] leading-7">{text}</p>
    <div className="mt-5 flex items-center justify-between text-xs text-slate-400"><span>Verified BizUno customer</span><span>★★★★★</span></div>
  </article>;
}
