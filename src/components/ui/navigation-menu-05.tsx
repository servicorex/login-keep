import React from "react";
import { BookOpen, Home, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";

const navigationMenuItems = [
  { title: "Home", href: "#", icon: Home, isActive: true },
  { title: "Blog", href: "#blog", icon: Rss },
  { title: "Docs", href: "#docs", icon: BookOpen },
];

export default function NavigationMenuWithActiveItem() {
  return (
    <NavigationMenu className="dark text-slate-100">
      <NavigationMenuList className="space-x-8">
        {navigationMenuItems.map((item) => (
          <NavigationMenuItem key={item.title}>
            <NavigationMenuLink
              active={item.isActive}
              asChild
              className={cn(
                "group relative inline-flex h-9 w-max items-center justify-center px-0.5 py-2 font-medium text-sm text-slate-300 transition-colors",
                "before:absolute before:inset-x-0 before:bottom-0 before:h-[2px] before:scale-x-0 before:bg-purple-500 before:transition-transform",
                "hover:text-white hover:before:scale-x-100",
                "focus:text-white focus:outline-hidden focus:before:scale-x-100",
                "disabled:pointer-events-none disabled:opacity-50",
                "data-active:text-white data-active:bg-transparent data-[state=open]:before:scale-x-100 data-active:before:scale-x-100",
                "hover:bg-transparent focus:bg-transparent active:bg-transparent",
              )}
            >
              <a className="flex flex-row items-center gap-2.5" href={item.href}>
                <item.icon className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-purple-400 transition-colors" />
                <span>{item.title}</span>
              </a>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}

