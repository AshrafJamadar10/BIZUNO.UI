import { useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Pencil, Plus, ShieldCheck, Trash2, UserRound, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/common/PageHeader";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SCOPES = ["DASHBOARD", "CUSTOMERS", "PRODUCTS", "INVENTORY", "SALES_INVOICES", "PAYMENTS", "SUPPLIERS", "REPORTS", "SETTINGS", "USERS_ROLES"] as const;
type Scope = (typeof SCOPES)[number];
type Operation = "CREATE" | "READ" | "UPDATE" | "DELETE";
type PermissionMap = Record<Scope, Operation[]>;
type Role = { id: string; name: string; description: string; permissions: PermissionMap; system?: boolean };
type Staff = { id: string; name: string; email: string; phone: string; department: string; role: string; status: "active" | "inactive"; joinedAt: string };
type Attendance = { id: string; staffId: string; date: string; status: "Present" | "Absent" | "Half day" | "Leave"; checkIn: string; checkOut: string; note: string };
type User = { id: string; name: string; email: string; role: string; status: "active" | "inactive"; lastActive: string };

const initialRoles: Role[] = [
  { id: "role-owner", name: "Owner", description: "Full workspace access and administration.", permissions: Object.fromEntries(SCOPES.map((scope) => [scope, ["CREATE", "READ", "UPDATE", "DELETE"]])) as PermissionMap, system: true },
  { id: "role-manager", name: "Manager", description: "Manages daily business operations.", permissions: Object.fromEntries(SCOPES.map((scope) => [scope, ["READ"]])) as PermissionMap },
  { id: "role-salesperson", name: "Salesperson", description: "Creates sales and manages customers.", permissions: Object.fromEntries(SCOPES.map((scope) => [scope, ["READ"]])) as PermissionMap },
  { id: "role-accountant", name: "Accountant", description: "Manages payments and financial reports.", permissions: Object.fromEntries(SCOPES.map((scope) => [scope, ["READ"]])) as PermissionMap },
];
const initialUsers: User[] = [
  { id: "usr-1", name: "Ashraf Jamadar", email: "ashraf@bizuno.local", role: "Owner", status: "active", lastActive: "Just now" },
  { id: "usr-2", name: "Priya Shah", email: "priya@nexustraders.in", role: "Manager", status: "active", lastActive: "Today, 10:42 AM" },
];
const initialStaff: Staff[] = [
  { id: "staff-1", name: "Rohan Patil", email: "rohan@nexustraders.in", phone: "+91 98765 43210", department: "Sales", role: "Salesperson", status: "active", joinedAt: "12 Jun 2026" },
  { id: "staff-2", name: "Meera Kulkarni", email: "meera@nexustraders.in", phone: "+91 97654 32109", department: "Accounts", role: "Accountant", status: "active", joinedAt: "04 Apr 2026" },
];
const initialAttendance: Attendance[] = [
  { id: "att-1", staffId: "staff-1", date: "2026-09-13", status: "Present", checkIn: "09:12", checkOut: "18:04", note: "" },
  { id: "att-2", staffId: "staff-2", date: "2026-09-13", status: "Half day", checkIn: "09:30", checkOut: "13:15", note: "Personal appointment" },
];

export const Route = createFileRoute("/users/")({
  beforeLoad: () => {
    const role = window.localStorage.getItem("bizuno-demo-role");
    if (!role || role === "PlatformAdmin") throw redirect({ to: "/login" });
  },
  component: UsersPage,
});

function UsersPage() {
  const [tab, setTab] = useState<"users" | "roles" | "staff" | "attendance">("users");
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState(initialRoles);
  const [staff, setStaff] = useState(initialStaff);
  const [attendance, setAttendance] = useState(initialAttendance);
  const [attendanceDialog, setAttendanceDialog] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({ staffId: "", date: "", status: "" as Attendance["status"], checkIn: "", checkOut: "", note: "" });
  const [userDialog, setUserDialog] = useState(false);
  const [roleDialog, setRoleDialog] = useState(false);
  const [staffDialog, setStaffDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [userForm, setUserForm] = useState({ name: "", email: "", role: "" });
  const [roleForm, setRoleForm] = useState({ name: "", description: "", permissions: {} as PermissionMap });
  const [staffForm, setStaffForm] = useState({ name: "", email: "", phone: "", department: "", role: "" });

  const saveStaff = () => {
    if (!staffForm.name || !staffForm.email || !staffForm.role) return;
    setStaff((current) => editingStaff
      ? current.map((item) => item.id === editingStaff.id ? { ...item, ...staffForm } : item)
      : [...current, { ...staffForm, id: `staff-${Date.now()}`, status: "active", joinedAt: new Date().toLocaleDateString("en-IN") }]);
    toast.success(editingStaff ? "Staff member updated" : "Staff member created");
    setStaffDialog(false); setEditingStaff(null); setStaffForm({ name: "", email: "", phone: "", department: "", role: "Salesperson" });
  };
  const saveUser = () => {
    if (!userForm.name || !userForm.email) return;
    setUsers((current) => editingUser ? current.map((item) => item.id === editingUser.id ? { ...item, ...userForm } : item) : [...current, { ...userForm, id: `usr-${Date.now()}`, status: "active", lastActive: "Never" }]);
    toast.success(editingUser ? "User updated" : "Invitation sent");
    setUserDialog(false); setEditingUser(null); setUserForm({ name: "", email: "", role: "Salesperson" });
  };
  const saveRole = () => {
    if (!roleForm.name || Object.keys(roleForm.permissions).length === 0) return;
    setRoles((current) => editingRole ? current.map((item) => item.id === editingRole.id ? { ...item, ...roleForm } : item) : [...current, { ...roleForm, id: `role-${Date.now()}` }]);
    toast.success(editingRole ? "Role updated" : "Role created");
    setRoleDialog(false); setEditingRole(null); setRoleForm({ name: "", description: "", permissions: {} as PermissionMap });
  };
  const toggleOperation = (scope: Scope, operation: Operation) => setRoleForm((current) => {
    const operations = current.permissions[scope] ?? [];
    const nextOperations = operations.includes(operation) ? operations.filter((item) => item !== operation) : [...operations, operation];
    const permissions = { ...current.permissions };
    if (nextOperations.length > 0) permissions[scope] = nextOperations;
    else delete permissions[scope];
    return { ...current, permissions };
  });
  const roleOptions = roles.map((role) => role.name);
  const saveAttendance = () => {
    if (!attendanceForm.staffId || !attendanceForm.date) return;
    setAttendance((current) => editingAttendance ? current.map((item) => item.id === editingAttendance.id ? { ...item, ...attendanceForm } : item) : [...current, { ...attendanceForm, id: `att-${Date.now()}` }]);
    toast.success(editingAttendance ? "Attendance updated" : "Attendance recorded");
    setAttendanceDialog(false); setEditingAttendance(null);
  };

  return <AppShell>
    <PageHeader title="Users, roles & staff" description="Manage users, define access roles and assign roles to staff." crumbs={[{ label: "Home", to: "/" }, { label: "Users & roles" }]} actions={tab === "users" ? <Dialog open={userDialog} onOpenChange={setUserDialog}><DialogTrigger asChild><Button><Plus className="size-4" /> Invite user</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{editingUser ? "Edit user" : "Invite team member"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Full name</Label><Input className="mt-1.5" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} /></div><div><Label>Email address</Label><Input className="mt-1.5" type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} /></div><div><Label>Role</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value })}>{roleOptions.map((role) => <option key={role}>{role}</option>)}</select></div></div><DialogFooter><Button variant="outline" onClick={() => setUserDialog(false)}>Cancel</Button><Button disabled={!userForm.name || !userForm.email} onClick={saveUser}>{editingUser ? "Save changes" : "Send invitation"}</Button></DialogFooter></DialogContent></Dialog> : tab === "roles" ? <Dialog open={roleDialog} onOpenChange={setRoleDialog}><DialogTrigger asChild><Button><Plus className="size-4" /> New role</Button></DialogTrigger><DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editingRole ? "Edit role" : "Create role"}</DialogTitle></DialogHeader><div className="space-y-4"><div><Label>Role name</Label><Input className="mt-1.5" value={roleForm.name} onChange={(event) => setRoleForm({ ...roleForm, name: event.target.value })} disabled={editingRole?.system} /></div><div><Label>Description</Label><Input className="mt-1.5" value={roleForm.description} onChange={(event) => setRoleForm({ ...roleForm, description: event.target.value })} /></div><div><Label>Module permissions</Label>    <div className="mt-2 max-h-[45vh] overflow-auto rounded-md border"><Table><TableHeader><TableRow><TableHead>Scope</TableHead>{(["CREATE", "READ", "UPDATE", "DELETE"] as Operation[]).map((operation) => <TableHead key={operation} className="text-center">{operation}</TableHead>)}</TableRow></TableHeader><TableBody>{SCOPES.map((scope) => <TableRow key={scope}><TableCell className="font-medium">{scope}</TableCell>{(["CREATE", "READ", "UPDATE", "DELETE"] as Operation[]).map((operation) => <TableCell key={operation} className="text-center"><input type="checkbox" aria-label={`${scope} ${operation}`} checked={roleForm.permissions[scope]?.includes(operation) ?? false} onChange={() => toggleOperation(scope, operation)} /></TableCell>)}</TableRow>)}</TableBody></Table></div></div></div><DialogFooter><Button variant="outline" onClick={() => setRoleDialog(false)}>Cancel</Button><Button disabled={!roleForm.name || Object.keys(roleForm.permissions).length === 0} onClick={saveRole}>Save role</Button></DialogFooter></DialogContent></Dialog> : <Dialog open={staffDialog} onOpenChange={setStaffDialog}><DialogTrigger asChild><Button><Plus className="size-4" /> Create staff</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{editingStaff ? "Edit staff member" : "Create staff member"}</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div><Label>Full name</Label><Input className="mt-1.5" value={staffForm.name} onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })} /></div><div><Label>Email</Label><Input className="mt-1.5" type="email" value={staffForm.email} onChange={(event) => setStaffForm({ ...staffForm, email: event.target.value })} /></div><div><Label>Phone</Label><Input className="mt-1.5" value={staffForm.phone} onChange={(event) => setStaffForm({ ...staffForm, phone: event.target.value })} /></div><div><Label>Department</Label><Input className="mt-1.5" value={staffForm.department} onChange={(event) => setStaffForm({ ...staffForm, department: event.target.value })} /></div><div className="sm:col-span-2"><Label>Assign role</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={staffForm.role} onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}>{roleOptions.map((role) => <option key={role}>{role}</option>)}</select></div></div><DialogFooter><Button variant="outline" onClick={() => setStaffDialog(false)}>Cancel</Button><Button disabled={!staffForm.name || !staffForm.email} onClick={saveStaff}>{editingStaff ? "Save changes" : "Create staff"}</Button></DialogFooter></DialogContent></Dialog>} />
    <div className="flex w-fit gap-1 rounded-lg bg-muted p-1"><Button variant={tab === "users" ? "default" : "ghost"} size="sm" onClick={() => setTab("users")}>Users</Button><Button variant={tab === "roles" ? "default" : "ghost"} size="sm" onClick={() => setTab("roles")}><ShieldCheck className="size-4" /> Roles</Button><Button variant={tab === "staff" ? "default" : "ghost"} size="sm" onClick={() => setTab("staff")}><UserRound className="size-4" /> Staff</Button><Button variant={tab === "attendance" ? "default" : "ghost"} size="sm" onClick={() => setTab("attendance")}>Attendance</Button></div>
    {tab === "users" ? <Card className="p-0"><div className="border-b p-4"><p className="font-semibold">Workspace users</p><p className="mt-1 text-sm text-muted-foreground">{users.length} users configured for this business.</p></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Last active</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{users.map((user) => <TableRow key={user.id}><TableCell><p className="font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></TableCell><TableCell>{user.role}</TableCell><TableCell>{user.lastActive}</TableCell><TableCell><StatusBadge status={user.status} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setUserForm({ name: user.name, email: user.email, role: user.role }); setUserDialog(true); }}><Pencil className="size-4" /></Button>{user.role !== "Owner" && <Button variant="ghost" size="icon" onClick={() => { setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: item.status === "active" ? "inactive" : "active" } : item)); toast.success("User status updated"); }}><UserRoundX className="size-4" /></Button>}</TableCell></TableRow>)}</TableBody></Table></div></Card> : tab === "roles" ? <div className="grid gap-4 md:grid-cols-2">{roles.map((role) => <Card key={role.id} className="p-5"><div className="flex items-start justify-between"><div><h2 className="font-semibold">{role.name}</h2><p className="mt-1 text-sm text-muted-foreground">{role.description}</p></div><div className="flex"><Button variant="ghost" size="icon" onClick={() => { setEditingRole(role);     setRoleForm({ name: role.name, description: role.description, permissions: { ...role.permissions } }); setRoleDialog(true); }}><Pencil className="size-4" /></Button>{!role.system && <Button variant="ghost" size="icon" onClick={() => { setRoles((current) => current.filter((item) => item.id !== role.id)); toast.success("Role deleted"); }}><Trash2 className="size-4" /></Button>}</div></div>    <div className="mt-5 space-y-2">{Object.entries(role.permissions).map(([scope, operations]) => <div key={scope} className="flex flex-wrap items-center gap-2 text-xs"><span className="font-medium">{scope}</span>{operations.map((operation) => <span key={operation} className="rounded-full bg-muted px-2.5 py-1">{operation}</span>)}</div>)}</div><p className="mt-5 text-xs text-muted-foreground">{staff.filter((item) => item.role === role.name).length} staff assigned</p></Card>)}    </div> : tab === "staff" ? <Card className="p-0"><div className="border-b p-4"><p className="font-semibold">Staff directory</p><p className="mt-1 text-sm text-muted-foreground">Create staff records and assign each person a workspace role.</p></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Staff member</TableHead><TableHead>Department</TableHead><TableHead>Phone</TableHead><TableHead>Assigned role</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader><TableBody>{staff.map((member) => <TableRow key={member.id}><TableCell><p className="font-medium">{member.name}</p><p className="text-xs text-muted-foreground">{member.email}</p></TableCell><TableCell>{member.department || "—"}</TableCell><TableCell>{member.phone || "—"}</TableCell><TableCell>{member.role}</TableCell><TableCell><StatusBadge status={member.status} /></TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingStaff(member); setStaffForm({ name: member.name, email: member.email, phone: member.phone, department: member.department, role: member.role }); setStaffDialog(true); }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setStaff((current) => current.map((item) => item.id === member.id ? { ...item, status: item.status === "active" ? "inactive" : "active" } : item)); toast.success("Staff status updated"); }}><UserRoundX className="size-4" /></Button></TableCell></TableRow>)}</TableBody></Table>    </div></Card> : null}
    {tab === "attendance" ? <Card className="p-0"><div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div><p className="font-semibold">Staff attendance</p><p className="mt-1 text-sm text-muted-foreground">Record and manage daily attendance for your staff.</p></div><Dialog open={attendanceDialog} onOpenChange={setAttendanceDialog}><DialogTrigger asChild><Button><Plus className="size-4" /> Add attendance</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{editingAttendance ? "Edit attendance" : "Add staff attendance"}</DialogTitle></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div><Label>Staff member</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={attendanceForm.staffId} onChange={(event) => setAttendanceForm({ ...attendanceForm, staffId: event.target.value })}>{staff.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></div><div><Label>Date</Label><Input className="mt-1.5" type="date" value={attendanceForm.date} onChange={(event) => setAttendanceForm({ ...attendanceForm, date: event.target.value })} /></div><div><Label>Status</Label><select className="mt-1.5 h-9 w-full rounded-md border bg-background px-3 text-sm" value={attendanceForm.status} onChange={(event) => setAttendanceForm({ ...attendanceForm, status: event.target.value as Attendance["status"] })}><option>Present</option><option>Absent</option><option>Half day</option><option>Leave</option></select></div><div><Label>Check in</Label><Input className="mt-1.5" type="time" value={attendanceForm.checkIn} onChange={(event) => setAttendanceForm({ ...attendanceForm, checkIn: event.target.value })} /></div><div><Label>Check out</Label><Input className="mt-1.5" type="time" value={attendanceForm.checkOut} onChange={(event) => setAttendanceForm({ ...attendanceForm, checkOut: event.target.value })} /></div><div><Label>Note</Label><Input className="mt-1.5" value={attendanceForm.note} onChange={(event) => setAttendanceForm({ ...attendanceForm, note: event.target.value })} /></div></div><DialogFooter><Button variant="outline" onClick={() => setAttendanceDialog(false)}>Cancel</Button><Button disabled={!attendanceForm.staffId || !attendanceForm.date} onClick={saveAttendance}>Save attendance</Button></DialogFooter></DialogContent></Dialog></div><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Staff member</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Check in</TableHead><TableHead>Check out</TableHead><TableHead>Note</TableHead><TableHead /></TableRow></TableHeader><TableBody>{attendance.map((record) => <TableRow key={record.id}><TableCell>{staff.find((member) => member.id === record.staffId)?.name ?? "Unknown staff"}</TableCell><TableCell>{record.date}</TableCell><TableCell><StatusBadge status={record.status.toLowerCase().replace(" ", "_")} /></TableCell><TableCell>{record.checkIn || "—"}</TableCell><TableCell>{record.checkOut || "—"}</TableCell><TableCell>{record.note || "—"}</TableCell><TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => { setEditingAttendance(record); setAttendanceForm({ staffId: record.staffId, date: record.date, status: record.status, checkIn: record.checkIn, checkOut: record.checkOut, note: record.note }); setAttendanceDialog(true); }}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" onClick={() => { setAttendance((current) => current.filter((item) => item.id !== record.id)); toast.success("Attendance deleted"); }}><Trash2 className="size-4" /></Button></TableCell></TableRow>)}</TableBody></Table></div></Card> : null}
  </AppShell>;
}
