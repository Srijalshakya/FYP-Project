"use client"

import ProductDetailsDialog from "@/components/shopping-view/product-details"
import ShoppingProductTile from "@/components/shopping-view/product-tile"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice"
import { fetchProductDetails } from "@/store/shop/products-slice"
import { getSearchResults, resetSearchResults } from "@/store/shop/search-slice"
import { useEffect, useState, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"

function SearchProducts() {
  const [keyword, setKeyword] = useState("");
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();
  const { searchResults } = useSelector((state) => state.shopSearch);
  const { productDetails } = useSelector((state) => state.shopProducts);
  const { user } = useSelector((state) => state.auth);
  const { cartItems } = useSelector((state) => state.shopCart);
  const { toast } = useToast();
  const searchTimeoutRef = useRef(null);
  const hasInitializedKeyword = useRef(false);

  // Debug renders
  useEffect(() => {
    console.log("SearchProducts Rendered");
  });

  // Debug state updates
  const handleKeywordChange = (event) => {
    const newValue = event.target.value;
    console.log("Input Change - New Value:", newValue);
    setKeyword(newValue);
  };

  // Debug focus
  const handleFocus = () => {
    console.log("Input Focused");
  };

  // Initialize keyword from URL only once
  useEffect(() => {
    if (hasInitializedKeyword.current) return;

    const initialKeyword = searchParams.get("keyword") || "";
    console.log("Initializing Keyword from URL:", initialKeyword);
    setKeyword(initialKeyword);
    hasInitializedKeyword.current = true;

    if (initialKeyword && initialKeyword.trim().length > 3) {
      dispatch(getSearchResults(initialKeyword)).then((action) => {
        if (action.payload?.success) {
          console.log("Initial Search Results:", action.payload.data);
        } else {
          console.error("Initial Search Failed:", action.payload?.message);
          toast({
            title: "Search Failed",
            description: action.payload?.message || "Unable to fetch search results",
            variant: "destructive",
          });
        }
      });
    }
  }, [searchParams, dispatch, toast]);

  // Debounced Search with Cleanup
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (keyword && keyword.trim() !== "" && keyword.trim().length > 3) {
      searchTimeoutRef.current = setTimeout(() => {
        setSearchParams(new URLSearchParams(`?keyword=${keyword}`));
        dispatch(getSearchResults(keyword)).then((action) => {
          if (action.payload?.success) {
            console.log("Search Results:", action.payload.data);
          } else {
            console.error("Search Failed:", action.payload?.message);
            toast({
              title: "Search Failed",
              description: action.payload?.message || "Unable to fetch search results",
              variant: "destructive",
            });
          }
        });
      }, 1000);
    } else {
      if (keyword.trim().length <= 3 && hasInitializedKeyword.current) {
        setSearchParams(new URLSearchParams());
        dispatch(resetSearchResults());
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [keyword, dispatch, setSearchParams, toast]);

  // Map search results to ensure `id` field and correct field names
  const mappedSearchResults = searchResults.map((item) => ({
    ...item,
    id: item._id || item.id,
    discountPrice: item.salePrice || item.discountPrice,
  }));

  // Handle Add to Cart with Stock Validation
  function handleAddtoCart(getCurrentProductId, getTotalStock) {
    console.log("Add to Cart Input:", { getCurrentProductId, getTotalStock, userId: user?.id });
    if (!user?.id) {
      toast({
        title: "Please log in to add items to your cart",
        variant: "destructive",
      });
      return;
    }

    if (!getCurrentProductId || getTotalStock === undefined) {
      toast({
        title: "Invalid product data",
        description: "Product ID or stock information is missing",
        variant: "destructive",
      });
      return;
    }

    let getCartItems = cartItems?.items || [];
    if (getCartItems.length) {
      const indexOfCurrentItem = getCartItems.findIndex(
        (item) => item.productId === getCurrentProductId
      );
      if (indexOfCurrentItem > -1) {
        const getQuantity = getCartItems[indexOfCurrentItem].quantity;
        if (getQuantity + 1 > getTotalStock) {
          toast({
            title: `Only ${getQuantity} quantity can be added for this item`,
            variant: "destructive",
          });
          return;
        }
      }
    }

    dispatch(
      addToCart({
        userId: user.id,
        productId: getCurrentProductId,
        quantity: 1,
      })
    ).then((data) => {
      console.log("Add to Cart Response:", data);
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user.id));
        toast({
          title: "Gear Added to Cart!",
          className: "bg-green-600 text-white",
        });
      } else {
        toast({
          title: "Failed to add item to cart",
          description: data?.payload?.message || "Unknown error",
          variant: "destructive",
        });
      }
    }).catch((error) => {
      console.error("Add to Cart Error:", error);
      toast({
        title: "Error adding item to cart",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    });
  }

  // Handle Product Details
  function handleGetProductDetails(getCurrentProductId) {
    console.log("Fetching Product Details for ID:", getCurrentProductId);
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  // Open Dialog
  useEffect(() => {
    if (productDetails !== null) {
      setOpenDetailsDialog(true);
    }
  }, [productDetails]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Search Section */}
      <section className="container mx-auto md:px-6 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-12"
        >
          <div className="relative w-full max-w-2xl">
            <Input
              value={keyword}
              name="keyword"
              onChange={handleKeywordChange}
              onFocus={handleFocus}
              className="py-7 pl-12 pr-4 text-lg bg-gray-800 border-2 border-red-600/50 rounded-full focus:border-red-600 focus:ring-0 text-white placeholder-gray-400 transition-all duration-300"
              placeholder="Search Gym Gear..."
              aria-label="Search gym equipment"
              autoComplete="off"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-red-600" />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6 py-2 font-semibold"
                onClick={() => {
                  if (keyword.trim().length > 3) {
                    setSearchParams(new URLSearchParams(`?keyword=${keyword}`));
                    dispatch(getSearchResults(keyword)).then((action) => {
                      if (action.payload?.success) {
                        console.log("Manual Search Results:", action.payload.data);
                      } else {
                        console.error("Manual Search Failed:", action.payload?.message);
                        toast({
                          title: "Search Failed",
                          description: action.payload?.message || "Unable to fetch search results",
                          variant: "destructive",
                        });
                      }
                    });
                  }
                }}
                aria-label="Search products"
              >
                Search
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Search Results */}
        <AnimatePresence>
          {!mappedSearchResults.length ? (
            <motion.h2
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-4xl md:text-5xl font-extrabold uppercase text-center text-gray-400"
            >
              No Gear Found!
            </motion.h2>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {mappedSearchResults.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative group"
                >
                  <ShoppingProductTile
                    product={item}
                    handleAddtoCart={handleAddtoCart}
                    handleGetProductDetails={handleGetProductDetails}
                    className="bg-gray-800 rounded-lg shadow-lg transform group-hover:scale-105 transition-transform duration-300 border border-red-600/20"
                  />
                  <motion.div
                    className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"
                    whileHover={{ scale: 1.02 }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Product Details Dialog */}
      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
        className="bg-gray-900 text-white border-red-600/50"
      />
    </div>
  );
}

export default SearchProducts;