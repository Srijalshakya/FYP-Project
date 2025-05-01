"use client"

import ProductFilter from "@/components/shopping-view/filter"
import ProductDetailsDialog from "@/components/shopping-view/product-details"
import ShoppingProductTile from "@/components/shopping-view/product-tile"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { sortOptions } from "@/config"
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice"
import { fetchAllFilteredProducts, fetchProductDetails } from "@/store/shop/products-slice"
import { ArrowUpDownIcon, SearchIcon, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSearchParams } from "react-router-dom"

function createSearchParamsHelper(filterParams) {
  const queryParams = []

  for (const [key, value] of Object.entries(filterParams)) {
    if ((key === "category" || key === "equipmentType") && Array.isArray(value) && value.length > 0) {
      const paramValue = value.join(",")
      queryParams.push(`${key}=${encodeURIComponent(paramValue)}`)
    }
  }

  return queryParams.join("&")
}

function ShoppingListing() {
  const dispatch = useDispatch()
  const { productList, productDetails, isLoading } = useSelector((state) => state.shopProducts)
  const { cartItems } = useSelector((state) => state.shopCart)
  const { user } = useSelector((state) => state.auth)
  const [filters, setFilters] = useState({})
  const [sort, setSort] = useState("price-lowtohigh")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchParams, setSearchParams] = useSearchParams()
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const { toast } = useToast()

  const categorySearchParam = searchParams.get("category")

  function handleSort(value) {
    setSort(value)
  }

  function handleFilter(getSectionId, getCurrentOption) {
    if (getSectionId === "category" || getSectionId === "equipmentType") {
      let cpyFilters = { ...filters }
      const indexOfCurrentSection = Object.keys(cpyFilters).indexOf(getSectionId)

      if (indexOfCurrentSection === -1) {
        cpyFilters = {
          ...cpyFilters,
          [getSectionId]: [getCurrentOption],
        }
      } else {
        const indexOfCurrentOption = cpyFilters[getSectionId].indexOf(getCurrentOption)

        if (indexOfCurrentOption === -1) cpyFilters[getSectionId].push(getCurrentOption)
        else cpyFilters[getSectionId].splice(indexOfCurrentOption, 1)

        if (cpyFilters[getSectionId].length === 0) {
          delete cpyFilters[getSectionId]
        }
      }

      setFilters(cpyFilters)
      sessionStorage.setItem("filters", JSON.stringify(cpyFilters))
    }
  }

  function handleGetProductDetails(getCurrentProductId) {
    dispatch(fetchProductDetails(getCurrentProductId))
  }

  function handleAddtoCart(getCurrentProductId, getTotalStock) {
    const getCartItems = cartItems.items || []

    if (getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex((item) => item.productId === getCurrentProductId)
      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity
        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added for this item`,
            variant: "destructive",
          })
          return
        }
      }
    }

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

  function handleSearch() {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a search term",
        variant: "destructive",
      })
      return
    }
    dispatch(fetchAllFilteredProducts({ filterParams: filters, sortParams: sort, searchQuery }))
  }

  useEffect(() => {
    setSort("price-lowtohigh")
    setFilters(JSON.parse(sessionStorage.getItem("filters")) || {})
  }, [])

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      const createQueryString = createSearchParamsHelper(filters)
      setSearchParams(createQueryString)
    }
  }, [filters, setSearchParams])

  useEffect(() => {
    if (filters !== null && sort !== null) {
      dispatch(fetchAllFilteredProducts({ filterParams: filters, sortParams: sort, searchQuery }))
    }
  }, [dispatch, sort, filters, searchQuery])

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true)
  }, [productDetails])

  useEffect(() => {
    if (productList?.length === 0 && searchQuery) {
      toast({
        title: "No products found matching your search",
        variant: "destructive",
      })
    }
  }, [productList, searchQuery, toast])

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header Section */}
          <div className="p-4 md:p-6 border-b flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Gym Equipment</h2>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 font-medium">{productList?.length} Products</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-lg border-gray-300 hover:bg-gray-100 transition-all flex items-center gap-1">
                      <ArrowUpDownIcon className="h-4 w-4" />
                      <span>Sort by</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] rounded-lg shadow-lg">
                    <DropdownMenuRadioGroup value={sort} onValueChange={handleSort}>
                      {sortOptions.map((sortItem) => (
                        <DropdownMenuRadioItem
                          value={sortItem.id}
                          key={sortItem.id}
                          className="hover:bg-gray-100 rounded-md"
                        >
                          {sortItem.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 transition-all w-full sm:w-[500px]">
                <Input
                  type="text"
                  placeholder="Search equipment..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-l-lg border-0 focus:ring-0 text-lg py-2"
                />
                <Button
                  onClick={handleSearch}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 rounded-l-none rounded-r-lg transition-all duration-200 flex items-center gap-1 text-lg py-2 px-4 border-0"
                >
                  <SearchIcon className="h-5 w-5" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-4 md:p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : productList && productList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {productList.map((productItem) => (
                  <div
                    key={productItem.id}
                    className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 p-4"
                  >
                    <ShoppingProductTile
                      product={productItem}
                      onViewDetails={handleGetProductDetails}
                      onAddToCart={handleAddtoCart}
                      className="scale-110"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-10">
                No products available.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product Details Dialog */}
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

export default ShoppingListing;