import { Link } from "@tanstack/react-router"
import { Menu, PenTool } from "lucide-react"
import { useState } from "react"

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import { ModeToggle } from "./mode-toggle"
import { Button } from "./ui/button"
import UserMenu from "./user-menu"

export default function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigationItems = [
    { to: "/", label: "Home" },
    { to: "/dashboard", label: "Dashboard" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-border/40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        {/* Logo */}
        <Link className="mr-6 ml-2 flex items-center space-x-2 lg:mr-8" to="/">
          <PenTool className="h-6 w-6" />
          <span className="font-bold text-lg">OpenWrite</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.to}>
                <Link to={item.to}>
                  <Button size="sm" variant="ghost">
                    {item.label}
                  </Button>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Spacer */}
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <div className="hidden items-center space-x-2 md:flex">
              <ModeToggle />
              <UserMenu />
            </div>

            {/* Mobile Menu */}
            <Sheet onOpenChange={setMobileMenuOpen} open={mobileMenuOpen}>
              <SheetTrigger asChild>
                <Button className="md:hidden" size="icon" variant="ghost">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px]" side="right">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center space-x-2">
                      <PenTool className="h-6 w-6" />
                      <span className="font-bold text-lg">OpenWrite</span>
                    </div>
                  </SheetTitle>
                  <SheetDescription>Navigate through the application</SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  {navigationItems.map((item) => (
                    <Link key={item.to} onClick={() => setMobileMenuOpen(false)} to={item.to}>
                      <Button className="w-full justify-start" variant="ghost">
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                  <div className="flex items-center justify-between pt-4">
                    <ModeToggle />
                    <UserMenu />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      </div>
    </header>
  )
}
