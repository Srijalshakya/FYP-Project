"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Search, Home, ShoppingBag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchAllFilteredProducts, fetchProductDetails } from "@/store/shop/products-slice"
import ShoppingProductTile from "@/components/shopping-view/product-tile"
import { useNavigate } from "react-router-dom"
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice"
import { useToast } from "@/components/ui/use-toast"
import ProductDetailsDialog from "@/components/shopping-view/product-details"
import { getFeatureImages } from "@/store/common-slice"
import { getSearchResults } from "@/store/shop/search-slice"

function ShoppingHome() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const { productList, productDetails } = useSelector((state) => state.shopProducts)
  const { featureImageList } = useSelector((state) => state.commonFeature)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const { user } = useSelector((state) => state.auth)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Simplified Header Navigation
  const headerNavItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: ShoppingBag, label: "Products", path: "/shop/listing" },
  ]

  function handleSearch(e) {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchQuery)}`)
      dispatch(getSearchResults(searchQuery))
    }
  }

  function handleGetProductDetails(getCurrentProductId) {
    dispatch(fetchProductDetails(getCurrentProductId))
  }

  function handleAddtoCart(getCurrentProductId) {
    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
      }),
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id))
        toast({
          title: "Product is added to cart",
        })
      }
    })
  }

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true)
  }, [productDetails])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % featureImageList.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [featureImageList])

  useEffect(() => {
    dispatch(
      fetchAllFilteredProducts({
        filterParams: {},
        sortParams: "price-lowtohigh",
      }),
    )
  }, [dispatch])

  useEffect(() => {
    dispatch(getFeatureImages())
  }, [dispatch])

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % featureImageList.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + featureImageList.length) % featureImageList.length)
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Simplified Header */}
      <header className="border-b sticky top-0 z-50 bg-background">
        <div className="container mx-auto py-4">
          <div className="flex items-center justify-between gap-6">
            <nav className="flex items-center gap-4">
              {headerNavItems.map((item) => (
                <Button
                  key={item.path}
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => navigate(item.path)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer"
                  onClick={handleSearch}
                />
              </div>
            </form>
          </div>
        </div>
      </header>

      {/* Banner Carousel */}
      <div className="relative w-full h-[600px] overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {featureImageList?.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              <img
                src={image.imageUrl || "/placeholder.svg"}
                alt={`Banner ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
          onClick={nextSlide}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {featureImageList?.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                currentSlide === index ? "bg-primary" : "bg-primary/20"
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto py-16">
        <h2 className="text-3xl font-bold mb-8">Featured Products</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {productList?.map((product) => (
            <ShoppingProductTile
              key={product.id}
              product={product}
              onViewDetails={handleGetProductDetails}
              onAddToCart={handleAddtoCart}
            />
          ))}
        </div>
      </div>

      {openDetailsDialog && productDetails && (
        <ProductDetailsDialog
          open={openDetailsDialog}
          onOpenChange={setOpenDetailsDialog}
          productDetails={productDetails}
          onAddToCart={handleAddtoCart}
        />
      )}
    </div>
  )
}

export default ShoppingHome;

