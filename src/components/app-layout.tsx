
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, History as HistoryIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/history", label: "History", icon: HistoryIcon },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 pb-20">{children}</main>
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/80 backdrop-blur-sm z-10">
        <nav className="flex items-center justify-around h-14 max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive = item.href === '/home' 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-primary",
                  isActive && "text-primary"
                )}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </footer>
    </div>
  );
}
