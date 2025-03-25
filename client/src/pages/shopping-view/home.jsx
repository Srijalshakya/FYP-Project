import { Button } from "@/components/ui/button"
import { Dumbbell, HeartPulse, Settings, Weight, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchAllFilteredProducts, fetchProductDetails } from "@/store/shop/products-slice"
import ShoppingProductTile from "@/components/shopping-view/product-tile"
import { useNavigate } from "react-router-dom"
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice"
import { useToast } from "@/components/ui/use-toast"
import ProductDetailsDialog from "@/components/shopping-view/product-details"
import { getFeatureImages } from "@/store/common-slice"
import SearchProducts from "@/pages/shopping-view/search"

const categoriesWithIcon = [
  {
    id: "strength-training",
    label: "Strength Training",
    icon: Dumbbell,
  },
  {
    id: "cardio-equipment",
    label: "Cardio Equipment",
    icon: HeartPulse,
  },
  {
    id: "weight-training",
    label: "Weight Training",
    icon: Weight,
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: Settings,
  },
]

function ShoppingHome() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const { productList, productDetails } = useSelector((state) => state.shopProducts)
  const { featureImageList } = useSelector((state) => state.commonFeature)
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const { user } = useSelector((state) => state.auth)

  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { toast } = useToast()

  function handleNavigateToListingPage(getCurrentItem, section) {
    sessionStorage.removeItem("filters")
    const currentFilter = {
      [section]: [getCurrentItem.id],
    }

    sessionStorage.setItem("filters", JSON.stringify(currentFilter))
    navigate(`/shop/listing`)
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
      <div className="relative w-full h-[600px] overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {featureImageList?.map((image, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              <img
                src={image.image || "/placeholder.svg"}
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

      {/* Categories with larger icons */}
      <div className="container mx-auto py-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categoriesWithIcon.map((category) => {
            const Icon = category.icon
            return (
              <Card
                key={category.id}
                className="group cursor-pointer hover:border-primary hover:shadow-lg transition-all"
                onClick={() => handleNavigateToListingPage(category, "category")}
              >
                <CardContent className="p-8">
                  <div className="flex flex-col items-center gap-6">
                    <div className="p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-12 h-12 text-primary" />
                    </div>
                    <span className="text-lg font-medium">{category.label}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Featured Products */}
      <div className="container mx-auto py-12">
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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



