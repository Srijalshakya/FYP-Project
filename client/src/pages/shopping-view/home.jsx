import { Button } from "@/components/ui/button";
import { Dumbbell, HeartPulse, Settings, Weight, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllFilteredProducts, fetchProductDetails } from "@/store/shop/products-slice";
import ShoppingProductTile from "@/components/shopping-view/product-tile";
import { useNavigate } from "react-router-dom";
import { addToCart, fetchCartItems } from "@/store/shop/cart-slice";
import { useToast } from "@/components/ui/use-toast";
import ProductDetailsDialog from "@/components/shopping-view/product-details";
import { getFeatureImages } from "@/store/common-slice";
import SearchProducts from "@/pages/shopping-view/search";
import { fetchActiveDiscounts } from "@/store/admin/discount-slice";

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
];

function ShoppingHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { productList, productDetails } = useSelector((state) => state.shopProducts);
  const { featureImageList } = useSelector((state) => state.commonFeature);
  const { activeDiscountList } = useSelector((state) => state.adminDiscount);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const { user } = useSelector((state) => state.auth);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  function handleNavigateToListingPage(getCurrentItem, section) {
    sessionStorage.removeItem("filters");
    const currentFilter = {
      [section]: [getCurrentItem.id],
    };

    sessionStorage.setItem("filters", JSON.stringify(currentFilter));
    navigate(`/shop/listing`);
  }

  function handleGetProductDetails(getCurrentProductId) {
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  function handleAddtoCart(getCurrentProductId, totalStock) {
    if (!user?.id) {
      toast({
        title: "Please sign in to add items to cart",
        variant: "destructive",
      });
      return;
    }

    if (!getCurrentProductId) {
      toast({
        title: "Invalid product ID",
        variant: "destructive",
      });
      return;
    }

    if (totalStock === 0) {
      toast({
        title: "Product is out of stock",
        variant: "destructive",
      });
      return;
    }

    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
      }),
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({
          title: "Product is added to cart",
        });
      } else {
        toast({
          title: "Failed to add product to cart",
          variant: "destructive",
          description: data?.payload?.message || "An error occurred",
        });
      }
    });
  }

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) =>
        (prevSlide + 1) % (featureImageList.length + activeDiscountList.length)
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [featureImageList, activeDiscountList]);

  useEffect(() => {
    dispatch(
      fetchAllFilteredProducts({
        filterParams: {},
        sortParams: "price-lowtohigh",
      }),
    );
  }, [dispatch]);

  useEffect(() => {
    dispatch(getFeatureImages());
    dispatch(fetchActiveDiscounts());
  }, [dispatch]);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) =>
      (prevSlide + 1) % (featureImageList.length + activeDiscountList.length)
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) =>
      (prevSlide - 1 + featureImageList.length + activeDiscountList.length) %
      (featureImageList.length + activeDiscountList.length)
    );
  };

  const slides = [
    ...featureImageList.map((image) => ({ type: "image", content: image.image })),
    ...activeDiscountList.map((discount) => ({
      type: "discount",
      content: {
        description: discount.description,
        categories: discount.categories,
        percentage: discount.percentage,
        endDate: discount.endDate,
      },
    })),
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <div className="relative w-full h-[600px] overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="w-full h-full flex-shrink-0">
              {slide.type === "image" ? (
                <img
                  src={slide.content || "/placeholder.svg"}
                  alt={`Banner ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white">
                  <div className="text-center space-y-4">
                    <h2 className="text-4xl font-bold">{slide.content.description}</h2>
                    <p className="text-xl">
                      {slide.content.percentage}% OFF on{" "}
                      {slide.content.categories
                        .map(
                          (cat) =>
                            categoriesWithIcon.find((c) => c.id === cat)?.label || cat
                        )
                        .join(", ")}
                    </p>
                    <p className="text-sm">
                      Ends on {new Date(slide.content.endDate).toLocaleDateString()}
                    </p>
                    <Button
                      onClick={() =>
                        handleNavigateToListingPage(
                          { id: slide.content.categories[0] },
                          "category"
                        )
                      }
                      className="bg-white text-primary hover:bg-white/90"
                    >
                      Shop Now
                    </Button>
                  </div>
                </div>
              )}
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
          {slides.map((_, index) => (
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

      <div className="container mx-auto py-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categoriesWithIcon.map((category) => {
            const Icon = category.icon;
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
            );
          })}
        </div>
      </div>

      <div className="container mx-auto py-12">
        <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {productList?.map((product) => (
            <ShoppingProductTile
              key={product._id}
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
  );
}

export default ShoppingHome;