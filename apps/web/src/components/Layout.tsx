import { Bot, Building2, LogOut, Package } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { ChatProvider } from "../lib/chat";
import { useAuth } from "../lib/auth";
import { Badge } from "./ui";

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100"
  }`;

export function Layout() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <ChatProvider>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <Building2 className="size-5" aria-hidden />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{user.company.name}</p>
                <p className="text-xs text-slate-500">Workspace</p>
              </div>
            </div>

            <nav className="flex gap-1" aria-label="Principal">
              <NavLink to="/" end className={navClass}>
                <Package className="size-4" aria-hidden /> Produtos
              </NavLink>
              <NavLink to="/chat" className={navClass}>
                <Bot className="size-4" aria-hidden /> Assistente IA
              </NavLink>
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <Badge tone={user.role === "admin" ? "indigo" : "slate"}>{user.role === "admin" ? "Admin" : "Usuário"}</Badge>
              <button onClick={logout} aria-label="Sair" title="Sair" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700">
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8">
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  );
}
