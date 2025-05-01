"use client"

import { Dumbbell, LogOut, Menu, ShoppingCart, UserCog } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
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
import { motion } from "framer-motion"

const gymEquipmentMenuItems = [
  { id: "home", label: "Home", path: "/shop/home" },
  { id: "about", label: "About", path: "/shop/about" },
  { id: "equipments", label: "Equipments", path: "/shop/listing" },
]

function MenuItems() {
  const navigate = useNavigate()

  function handleNavigate(getCurrentMenuItem) {
    console.log("Menu Item Clicked:", getCurrentMenuItem)
    if (getCurrentMenuItem.id === "home" || getCurrentMenuItem.id === "about") {
      navigate(getCurrentMenuItem.path)
      return
    }

    // Handle "Equipments" (same as Special Deals functionality)
    if (getCurrentMenuItem.id === "equipments") {
      sessionStorage.removeItem("filters")
      const currentFilter = { deals: true }
      sessionStorage.setItem("filters", JSON.stringify(currentFilter))
      navigate(`${getCurrentMenuItem.path}?deals=true`)
    }
  }

  return (
    <nav className="flex flex-col mb-3 lg:mb-0 lg:items-center gap-4 lg:flex-row">
      {gymEquipmentMenuItems.map((menuItem) => (
        <div
          key={menuItem.id}
          className="text-sm font-semibold uppercase cursor-pointer text-gray-300 hover:text-red-600 transition-colors"
          onClick={() => handleNavigate(menuItem)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleNavigate(menuItem)}
        >
          {menuItem.label}
        </div>
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
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="outline" size="icon" className="relative bg-gray-800 border-red-600/50 text-white hover:bg-red-600/20">
              <ShoppingCart className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold">
                {cartItems?.items?.length || 0}
              </span>
              <span className="sr-only">Shopping cart</span>
            </Button>
          </motion.div>
        </SheetTrigger>
        <SheetContent className="bg-gray-900 text-white border-red-600/50">
          <UserCartWrapper
            setOpenCartSheet={setOpenCartSheet}
            cartItems={cartItems && cartItems.items && cartItems.items.length > 0 ? cartItems.items : []}
          />
        </SheetContent>
      </Sheet>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full bg-gray-800 border-red-600/50">
              <Avatar>
                <AvatarFallback className="bg-red-600 text-white font-bold">
                  {user?.userName?.[0]?.toUpperCase() || "F"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-gray-900 text-white border-red-600/50">
          <DropdownMenuLabel className="text-red-600">My FitMart Account</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-red-600/30" />
          <DropdownMenuItem
            onClick={() => navigate("/shop/account")}
            className="hover:bg-red-600/20 focus:bg-red-600/20 text-gray-300 hover:text-white"
          >
            <UserCog className="mr-2 h-4 w-4" />
            Account Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => navigate("/shop/orders")}
            className="hover:bg-red-600/20 focus:bg-red-600/20 text-gray-300 hover:text-white"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Order History
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-red-600/30" />
          <DropdownMenuItem
            onClick={handleLogout}
            className="hover:bg-red-600/20 focus:bg-red-600/20 text-gray-300 hover:text-white"
          >
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
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-40 w-full bg-gray-900/80 backdrop-blur-md border-b border-red-600/30"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/shop/home" className="flex items-center gap-2">
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <Dumbbell className="h-8 w-8 text-red-600" />
          </motion.div>
          <span className="font-bold text-2xl uppercase text-red-600 tracking-wider">FitMart</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button variant="outline" size="icon" className="lg:hidden bg-gray-800 border-red-600/50 text-white hover:bg-red-600/20">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </motion.div>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-xs bg-gray-900 text-white border-red-600/50">
            <div className="flex flex-col gap-6">
              <Link to="/shop/home" className="flex items-center gap-2">
                <Dumbbell className="h-8 w-8 text-red-600" />
                <span className="font-bold text-2xl uppercase text-red-600 tracking-wider">FitMart</span>
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
    </motion.header>
  )
}

export default ShoppingHeader;