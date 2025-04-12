import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { getOrderDetails } from "@/store/shop/order-slice/index";

function OrderSuccessPage() {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const result = await dispatch(getOrderDetails(orderId)).unwrap();
        if (result?.success) {
          setOrderDetails(result.data);
        }
      } catch (error) {
        console.error("Failed to fetch order details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [dispatch, orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg text-center">
      <div className="flex justify-center mb-4">
        <div className="bg-green-100 rounded-full p-3">
          <CheckCircle className="h-12 w-12 text-green-500" />
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-green-600 mb-2">Order Placed Successfully!</h1>
      <p className="text-gray-600 mb-8">
        Thank you for your purchase. A confirmation email has been sent to your email address.
      </p>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4 text-center">Order Summary</h2>
          
          <div className="grid grid-cols-2 gap-2 text-left mb-2">
            <p className="text-gray-600">Order Number:</p>
            <p className="font-medium">#{orderDetails?._id.substring(0, 8)}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-left mb-2">
            <p className="text-gray-600">Order Date:</p>
            <p className="font-medium">
              {orderDetails?.orderDate && new Date(orderDetails.orderDate).toLocaleDateString()}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-left mb-2">
            <p className="text-gray-600">Email:</p>
            <p className="font-medium">{orderDetails?.userId?.email || "customer@example.com"}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-left mb-2">
            <p className="text-gray-600">Payment Method:</p>
            <p className="font-medium">{orderDetails?.paymentMethod === "COD" ? "Cash on Delivery" : orderDetails?.paymentMethod}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-left border-t pt-3 mt-3">
            <p className="text-gray-900 font-semibold">Total:</p>
            <p className="font-bold text-green-600">${orderDetails?.totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to="/orders">
          <Button variant="outline" className="w-full sm:w-auto">View Order Details</Button>
        </Link>
        <Link to="/shop">
          <Button className="w-full sm:w-auto">Continue Shopping</Button>
        </Link>
      </div>
      
      <p className="mt-8 text-sm text-gray-500">
        Need help? <a href="#" className="text-blue-600 hover:underline">Contact our support team</a>
      </p>
    </div>
  );
}

export default OrderSuccessPage;