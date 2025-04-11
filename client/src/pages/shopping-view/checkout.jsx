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

  // Backend API base URL
  const API_BASE_URL = "http://localhost:5000";

  const totalCartAmount = cartItems?.items?.reduce(
    (sum, item) => sum + (item?.salePrice || item?.price) * item?.quantity,
    0
  ) || 0;

  const initiateKhaltiPayment = async () => {
    if (!cartItems?.items?.length || !currentSelectedAddress) {
      toast({
        title: "Please complete shipping information",
        variant: "destructive",
      });
      return;
    }
  
    setIsProcessing(true);
  
    try {
      // Prepare payload with all cart items
      const payload = {
        items: cartItems.items.map(item => ({
          itemId: item.productId,
          quantity: item.quantity,
          unitPrice: item.salePrice || item.price,
        })),
        website_url: window.location.origin,
        return_url: `${window.location.origin}/order-success`,
        shippingAddress: {
          address: currentSelectedAddress?.address || "",
          city: currentSelectedAddress?.city || "",
          postalCode: currentSelectedAddress?.pincode || "",
          country: "Nepal",
          phone: currentSelectedAddress?.phone || "",
        },
        totalAmount: totalCartAmount, // Add total amount to payload
      };
  
      const response = await fetch(`${API_BASE_URL}/api/payment/initialize-khalti`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
        credentials: 'include', 
        mode: 'cors'
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Payment initialization failed");
      }
  
      const data = await response.json();
  
      if (data.payment_url) {
        // Store order details temporarily
        localStorage.setItem('pendingOrder', JSON.stringify({
          cartItems: cartItems.items,
          shippingAddress: currentSelectedAddress,
          paymentMethod: "khalti",
          totalAmount: totalCartAmount,
          transactionId: data.pidx || null
        }));
  
        // Redirect to Khalti payment page
        window.location.href = data.payment_url;
      } else {
        throw new Error("Payment URL not received");
      }
    } catch (error) {
      console.error("Khalti payment error:", error);
      toast({
        title: "Payment Error",
        description: error.message || "Failed to initialize Khalti payment",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const completeOrder = async (paymentData) => {
    if (!currentSelectedAddress) {
      toast({
        title: "Shipping address is required",
        variant: "destructive",
      });
      return;
    }
  
    // For Khalti payments, check if we have transaction details
    const khaltiPayload = paymentData.paymentMethod === "khalti" 
      ? {
          pidx: paymentData.pidx,
          transactionId: paymentData.transactionId,
          amount: paymentData.amount
        }
      : null;
  
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
      },
      paymentMethod: paymentData.paymentMethod,
      paymentStatus: paymentData.paymentStatus,
      paymentDetails: khaltiPayload,
      itemsPrice: totalCartAmount,
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice: totalCartAmount,
      orderStatus: paymentData.paymentMethod === "cod" ? "pending" : "confirmed",
    };
  
    try {
      const action = await dispatch(createNewOrder(orderData));
      const result = action.payload;
  
      if (result?.success) {
        // Clear pending order from storage if it exists
        localStorage.removeItem('pendingOrder');
        
        const successMessage = 
          paymentData.paymentMethod === "cod" 
            ? "Order placed successfully! Pay when your items arrive." 
            : "Payment successful! Your order is confirmed.";
        
        toast({ title: successMessage });
        navigate(`/order/${result.order._id}`);
      } else {
        throw new Error(result?.message || "Order creation failed");
      }
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "Order Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  
  const handlePaymentSelection = (method) => {
    setPaymentMethod(method);
  };

  const handlePlaceOrder = async () => {
    if (!paymentMethod) {
      toast({ title: "Please select a payment method", variant: "destructive" });
      return;
    }

    try {
      if (paymentMethod === "khalti") {
        await initiateKhaltiPayment();
      } else if (paymentMethod === "cod") {
        setIsProcessing(true);
        await completeOrder({
          paymentMethod: "cod",
          paymentStatus: "pending"
        });
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
              <span>$ {totalCartAmount.toFixed(2)}</span>
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