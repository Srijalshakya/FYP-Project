import Address from "@/components/shopping-view/address";
import { useDispatch, useSelector } from "react-redux";
import UserCartItemsContent from "@/components/shopping-view/cart-items-content";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { createNewOrder } from "@/store/shop/order-slice";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

function ShoppingCheckout() {
  const { cartItems } = useSelector((state) => state.shopCart);
  const { user } = useSelector((state) => state.auth);
  const [currentSelectedAddress, setCurrentSelectedAddress] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalCartAmount =
    cartItems?.items?.reduce(
      (sum, item) => sum + (item?.salePrice || item?.price) * item?.quantity,
      0
    ) || 0;

  async function handleCheckout() {
    if (!cartItems?.items?.length) {
      toast({ title: "Your cart is empty", variant: "destructive" });
      return;
    }

    if (!currentSelectedAddress) {
      toast({ title: "Please select an address", variant: "destructive" });
      return;
    }

    if (!paymentProof) {
      toast({ title: "Please upload payment proof", variant: "destructive" });
      return;
    }

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
        address: currentSelectedAddress?.address,
        city: currentSelectedAddress?.city,
        postalCode: currentSelectedAddress?.pincode,
        country: "Nepal",
        phone: currentSelectedAddress?.phone,
      },
      paymentProof,
      itemsPrice: totalCartAmount,
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice: totalCartAmount,
      paymentStatus: "pending", // Admin will verify manually
      orderStatus: "pending",
    };

    try {
      const action = await dispatch(createNewOrder(orderData));
      
      if (!action || !action.payload) {
        throw new Error("No response from server");
      }

      const result = action.payload;

      if (result?.success) {
        toast({ title: "Order placed successfully! Awaiting admin verification.", variant: "default" });
        navigate(`/order/${result.order._id}`);
      } else {
        throw new Error(result?.message || "Order creation failed");
      }
    } catch (error) {
      console.error("Order error:", error);
      toast({
        title: "Order error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
          <Address selectedId={currentSelectedAddress} setCurrentSelectedAddress={setCurrentSelectedAddress} />
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
              <span>${totalCartAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <input type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} className="mb-4" />

          <Button onClick={handleCheckout} className="w-full py-6 text-lg" disabled={isProcessing || !paymentProof}>
            {isProcessing ? "Processing..." : "Submit Payment Proof & Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ShoppingCheckout;
