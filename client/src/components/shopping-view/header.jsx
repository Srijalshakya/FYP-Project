"use client"

import { Dumbbell, LogOut, Menu, ShoppingCart, UserCog } from "lucide-react"
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"
import { Button } from "../ui/button"
import { useDispatch, useSelector } from "react-redux"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { logoutUser } from "@/store/auth-slice"
import UserCartWrapper from "./cart-wrapper"
import { useEffect, useState } from "react"
import { fetchCartItems } from "@/store/shop/cart-slice"
import { Label } from "../ui/label"

// Updated menu items for gym equipment
const gymEquipmentMenuItems = [
  { id: "home", label: "Home", path: "/shop/home" },
  { id: "strength-training", label: "Strength Training", path: "/shop/listing" },
  { id: "cardio-equipment", label: "Cardio Equipment", path: "/shop/listing" },
  { id: "weight-training", label: "Weight Training", path: "/shop/listing" },
  { id: "accessories", label: "Accessories", path: "/shop/listing" },
  { id: "deals", label: "Special Deals", path: "/shop/listing" },
]

function MenuItems() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  function handleNavigate(getCurrentMenuItem) {
    sessionStorage.removeItem("filters")
    const currentFilter =
      getCurrentMenuItem.id !== "home" && getCurrentMenuItem.id !== "deals"
        ? {
            category: [getCurrentMenuItem.id],
          }
        : null

    sessionStorage.setItem("filters", JSON.stringify(currentFilter))

    location.pathname.includes("listing") && currentFilter !== null
      ? setSearchParams(new URLSearchParams(`?category=${getCurrentMenuItem.id}`))
      : navigate(getCurrentMenuItem.path)
  }

  return (
    <nav className="flex flex-col mb-3 lg:mb-0 lg:items-center gap-6 lg:flex-row">
      {gymEquipmentMenuItems.map((menuItem) => (
        <Label
          onClick={() => handleNavigate(menuItem)}
          className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
          key={menuItem.id}
        >
          {menuItem.label}
        </Label>
      ))}
    </nav>
  )
}

function HeaderRightContent() {
  const { user } = useSelector((state) => state.auth)
  const { cartItems } = useSelector((state) => state.shopCart)
  const [openCartSheet, setOpenCartSheet] = useState(false)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  function handleLogout() {
    dispatch(logoutUser())
  }

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchCartItems(user.id))
    }
  }, [dispatch, user?.id])

  return (
    <div className="flex lg:items-center lg:flex-row flex-col gap-4">
      <Sheet open={openCartSheet} onOpenChange={setOpenCartSheet}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
              {cartItems?.items?.length || 0}
            </span>
            <span className="sr-only">Shopping cart</span>
          </Button>
        </SheetTrigger>
        <UserCartWrapper
          setOpenCartSheet={setOpenCartSheet}
          cartItems={cartItems && cartItems.items && cartItems.items.length > 0 ? cartItems.items : []}
        />
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                {user?.userName?.[0]?.toUpperCase() || "F"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Fitmart Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate("/shop/account")}>
            <UserCog className="mr-2 h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/shop/orders")}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Order History
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function ShoppingHeader() {
  const { isAuthenticated } = useSelector((state) => state.auth)

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/shop/home" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">Fitmart</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-xs">
            <div className="flex flex-col gap-6">
              <Link to="/shop/home" className="flex items-center gap-2">
                <Dumbbell className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">Fitmart</span>
              </Link>
              <MenuItems />
              {isAuthenticated && <HeaderRightContent />}
            </div>
          </SheetContent>
        </Sheet>
        <div className="hidden lg:block">
          <MenuItems />
        </div>
        {isAuthenticated && (
          <div className="hidden lg:block">
            <HeaderRightContent />
          </div>
        )}
      </div>
    </header>
  )
}

export default ShoppingHeader;

