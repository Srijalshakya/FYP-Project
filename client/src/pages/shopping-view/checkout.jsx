import { useState } from "react";
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
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalCartAmount = cartItems?.items?.reduce(
    (sum, item) => sum + (item?.salePrice || item?.price) * item?.quantity,
    0
  ) || 0;

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
    try {
      setIsProcessing(true);

      const orderData = {
        userId: user?.id,
        cartId: cartItems?._id,
        cartItems: cartItems.items.map((item) => ({
          productId: item?.productId,
          title: item?.title,
          image: item?.image,
          price: item?.salePrice || item?.price,
          quantity: item?.quantity,
        })),
        shippingAddress: {
          address: currentSelectedAddress?.address || "",
          city: currentSelectedAddress?.city || "",
          postalCode: currentSelectedAddress?.pincode || "",
          country: "Nepal",
          phone: currentSelectedAddress?.phone || "",
          notes: currentSelectedAddress?.notes || "",
        },
        paymentMethod: paymentMethod,
        paymentStatus: "pending",
        itemsPrice: totalCartAmount,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: totalCartAmount,
        orderStatus: "pending",
        isPaid: false,
        user: {
          userName: user?.userName || "FitMart Customer",
          email: user?.email || "customer@fitmart.com",
        },
      };

      const action = await dispatch(createNewOrder(orderData));
      const result = action.payload;

      if (result?.success) {
        if (paymentMethod === "khalti") {
          sessionStorage.setItem("currentOrderId", result.orderId);
          localStorage.setItem('latestOrder', JSON.stringify({
            orderId: result.orderId,
            totalAmount: totalCartAmount,
            paymentMethod: paymentMethod,
          }));
          window.location.href = result.payment_url;
        } else if (paymentMethod === "cod") {
          localStorage.setItem('latestOrder', JSON.stringify({
            orderId: result.orderId,
            totalAmount: totalCartAmount,
            paymentMethod: paymentMethod,
          }));
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
        description: error.message || "Failed to place order",
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
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span>NPR {totalCartAmount.toFixed(2)}</span>
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