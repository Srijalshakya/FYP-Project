import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { CreditCard, Wallet } from "lucide-react";
import Address from "@/components/shopping-view/address";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { createNewOrder } from "@/store/shop/order-slice";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [consistentTotalCartAmount, setConsistentTotalCartAmount] = useState(0);
  const [originalTotalCartAmount, setOriginalTotalCartAmount] = useState(0);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Calculate original total (without discounts)
    const originalTotal = cartItems?.items?.reduce(
      (sum, item) => sum + (item?.originalPrice || item?.price) * item?.quantity,
      0
    ) || 0;

    // Calculate total with discounts applied
    const total = cartItems?.items?.reduce(
      (sum, item) =>
        sum +
        (item?.discountedPrice !== null && item?.discountedPrice !== undefined
          ? item.discountedPrice
          : item?.salePrice > 0
          ? item.salePrice
          : item?.price) *
          item?.quantity,
      0
    ) || 0;

    setOriginalTotalCartAmount(originalTotal);
    setConsistentTotalCartAmount(total);
    console.log("Original Total Cart Amount (USD):", originalTotal);
    console.log("Discounted Total Cart Amount (USD):", total);
    console.log("Initial Cart Items:", cartItems);
  }, [cartItems]);

  const EXCHANGE_RATE_USD_TO_NPR = 135;
  const originalTotalCartAmountInNPR = originalTotalCartAmount * EXCHANGE_RATE_USD_TO_NPR;
  const totalCartAmountInNPR = consistentTotalCartAmount * EXCHANGE_RATE_USD_TO_NPR;
  const totalDiscountInNPR = originalTotalCartAmountInNPR - totalCartAmountInNPR;

  const handlePaymentSelection = (method) => {
    if (["cod", "khalti"].includes(method)) {
      setPaymentMethod(method);
    }
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast({ title: "Please select a payment method", variant: "destructive" });
      return;
    }
    if (!currentSelectedAddress) {
      toast({
        title: "Shipping address is required",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      console.error("User ID is missing or invalid:", user);
      toast({
        title: "User Error",
        description: "User ID is missing. Please log in again.",
        variant: "destructive",
      });
      navigate("/auth/login");
      return;
    }

    try {
      setIsProcessing(true);

      const totalCartAmountInPaisa = totalCartAmountInNPR * 100;

      console.log("Total Cart Amount (USD) on Place Order:", consistentTotalCartAmount);
      console.log("Total Cart Amount (Paisa) for Khalti:", totalCartAmountInPaisa);

      const orderData = {
        userId: user?.id,
        cartId: cartItems?._id,
        cartItems: cartItems.items.map((item) => ({
          productId: item?.productId,
          title: item?.title,
          image: item?.image,
          price: item?.discountedPrice !== null && item?.discountedPrice !== undefined
            ? item.discountedPrice
            : item?.salePrice || item?.price,
          quantity: item?.quantity,
          unitPrice: item?.discountedPrice !== null && item?.discountedPrice !== undefined
            ? item.discountedPrice
            : item?.salePrice || item?.price,
          itemId: item?.productId,
        })),
        shippingAddress: {
          name: user?.userName || "FitMart Customer",
          email: user?.email || "customer@fitmart.com",
          address: currentSelectedAddress?.address || "",
          city: currentSelectedAddress?.city || "",
          postalCode: currentSelectedAddress?.pincode || "",
          country: "Nepal",
          phone: currentSelectedAddress?.phone || "",
          notes: currentSelectedAddress?.notes || "",
        },
        paymentMethod: paymentMethod,
        paymentStatus: "pending",
        itemsPrice: consistentTotalCartAmount, // Use the discounted total
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: paymentMethod === "khalti" ? totalCartAmountInPaisa : consistentTotalCartAmount,
        orderStatus: "pending",
        isPaid: false,
        user: {
          userName: user?.userName || "FitMart Customer",
          email: user?.email || "customer@fitmart.com",
        },
      };

      console.log("Order Data being sent to backend:", JSON.stringify(orderData, null, 2));

      const action = await dispatch(createNewOrder(orderData));
      const result = action.payload;

      if (result?.success) {
        if (paymentMethod === "khalti") {
          sessionStorage.setItem("currentOrderId", result.orderId);
          localStorage.setItem(
            "latestOrder",
            JSON.stringify({
              orderId: result.orderId,
              totalAmount: consistentTotalCartAmount,
              paymentMethod: paymentMethod,
            })
          );
          window.location.href = result.payment_url;
        } else if (paymentMethod === "cod") {
          localStorage.setItem(
            "latestOrder",
            JSON.stringify({
              orderId: result.orderId,
              totalAmount: consistentTotalCartAmount,
              paymentMethod: paymentMethod,
            })
          );
          toast({
            title: "Order placed successfully!",
            description: "Pay when your items arrive.",
          });
          navigate(`/shop/order-success/${result.orderId}`);
        }
      } else {
        throw new Error(result?.message || "Order creation failed");
      }
    } catch (error) {
      console.error("Order placement error:", error);
      toast({
        title: "Order Error",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <Address
            selectedId={currentSelectedAddress?._id}
            setCurrentSelectedAddress={setCurrentSelectedAddress}
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

          <div className="space-y-4 mb-6">
            {cartItems?.items?.map((item) => (
              <UserCartItemsContent key={item.productId} cartItem={item} />
            ))}
          </div>

          <div className="border-t pt-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-base">
                <span>Subtotal</span>
                <span>NPR {originalTotalCartAmountInNPR.toFixed(2)}</span>
              </div>
              {totalDiscountInNPR > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Discount</span>
                  <span>-NPR {totalDiscountInNPR.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>NPR {totalCartAmountInNPR.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Select Payment Method</h3>

            <div className="grid gap-4">
              <button
                onClick={() => handlePaymentSelection("khalti")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                  paymentMethod === "khalti"
                    ? "border-purple-500 ring-2 ring-purple-200 bg-purple-50"
                    : "hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center bg-purple-100 h-10 w-10 rounded-full">
                  <Wallet className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium block">Pay with Khalti</span>
                  <span className="text-sm text-gray-500">Fast and secure digital payment</span>
                </div>
                {paymentMethod === "khalti" && (
                  <span className="ml-auto text-purple-600 text-lg">✓</span>
                )}
              </button>

              <button
                onClick={() => handlePaymentSelection("cod")}
                className={`flex items-center gap-3 p-4 border rounded-lg transition-all ${
                  paymentMethod === "cod"
                    ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50"
                    : "hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-center bg-blue-100 h-10 w-10 rounded-full">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <span className="font-medium block">Cash on Delivery</span>
                  <span className="text-sm text-gray-500">Pay when your order arrives</span>
                </div>
                {paymentMethod === "cod" && (
                  <span className="ml-auto text-blue-600 text-lg">✓</span>
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handlePlaceOrder}
            className="w-full py-6 text-lg"
            disabled={isProcessing || !paymentMethod || !currentSelectedAddress}
          >
            {isProcessing ? "Processing..." : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;