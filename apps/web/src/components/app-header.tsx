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
        <Link
          className="ml-2 mr-6 flex items-center space-x-2 lg:mr-8"
          to="/"
        >
          <PenTool className="h-6 w-6" />
          <span className="font-bold text-lg">OpenWrite</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.to}>
                <Link to={item.to}>
                  <Button variant="ghost" size="sm">
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
            <div className="hidden md:flex items-center space-x-2">
              <ModeToggle />
              <UserMenu />
            </div>
            
            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px]">
                <SheetHeader>
                  <SheetTitle>
                    <div className="flex items-center space-x-2">
                      <PenTool className="h-6 w-6" />
                      <span className="font-bold text-lg">OpenWrite</span>
                    </div>
                  </SheetTitle>
                  <SheetDescription>
                    Navigate through the application
                  </SheetDescription>
                </SheetHeader>
                <div className="grid gap-4 py-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start">
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