"use client";

import { usePathname } from "next/navigation";
import { Home, Map, History as HistoryIcon, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigation } from "@/hooks/use-navigation";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

const navItems = [
  { href: "/home", label: "Home", icon: Home, navKey: "navigateToHome" },
  { href: "/map", label: "Map", icon: Map, navKey: "navigateToMap" },
  { href: "/history", label: "History", icon: HistoryIcon, navKey: "navigateToHistory" },
  { href: "/profile", label: "Profile", icon: User, navKey: "navigateToProfile" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const navigation = useNavigation();

  return (
    <div className="flex flex-col min-h-screen bg-background safe-area-top">
      <main className="flex-1 pb-20 native-scroll">{children}</main>
      <footer className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-md z-50 safe-area-bottom">
        <nav className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
          {navItems.map((item) => {
            const isActive = item.href === '/home' 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
            
            const handleNavigation = () => {
              const navFunction = navigation[item.navKey as keyof typeof navigation];
              if (typeof navFunction === 'function') {
                navFunction();
              }
            };

            return (
              <button
                key={item.href}
                onClick={handleNavigation}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 p-2 rounded-xl min-w-[60px] min-h-[60px] transition-all duration-200 app-button",
                  "text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/50",
                  isActive && "text-primary bg-primary/10"
                )}
              >
                <item.icon className={cn(
                  "transition-all duration-200",
                  isActive ? "w-7 h-7" : "w-6 h-6"
                )} />
                <span className={cn(
                  "text-xs font-medium transition-all duration-200",
                  isActive ? "font-semibold" : "font-normal"
                )}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </footer>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}
