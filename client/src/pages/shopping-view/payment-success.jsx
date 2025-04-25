import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrderDetails } from "@/store/shop/order-slice";
import { jsPDF } from "jspdf";

function PaymentSuccessPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orderDetails, isLoading, error } = useSelector((state) => state.shopOrder);
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (orderId) {
        const result = await dispatch(getOrderDetails(orderId));
        if (!result.payload?.success) {
          console.log("Failed to fetch order details:", result.payload);
          toast({
            title: "Error",
            description: "Failed to fetch order details",
            variant: "destructive",
          });
        } else if (result.payload.data.paymentStatus !== "completed" && retryCount < 10) {
          console.log(`Payment status not completed (attempt ${retryCount + 1}/10). Retrying...`);
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            dispatch(getOrderDetails(orderId));
          }, 5000);
        } else if (result.payload.data.paymentStatus !== "completed") {
          console.log("Max retries reached. Payment status still not completed:", result.payload.data);
          toast({
            title: "Payment Status Error",
            description: "Payment status could not be updated to completed. Please contact support.",
            variant: "destructive",
          });
        }
      } else {
        const latestOrder = JSON.parse(localStorage.getItem("latestOrder"));
        if (latestOrder?.orderId) {
          dispatch(getOrderDetails(latestOrder.orderId));
        } else {
          navigate("/shop/home");
        }
      }
    };

    fetchOrderDetails();
  }, [dispatch, orderId, navigate, toast, retryCount]);

  const generatePDF = () => {
    if (!orderDetails) return;

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FitMart Payment Receipt", 20, 20);
    doc.setFontSize(12);
    doc.text(`Order ID: ${orderDetails._id}`, 20, 40);
    doc.text(`Date: ${new Date(orderDetails.orderDate).toLocaleDateString()}`, 20, 50);
    doc.text(`Customer: ${orderDetails.user?.userName || "FitMart Customer"}`, 20, 60);
    doc.text(`Payment Method: ${orderDetails.paymentMethod.toUpperCase()}`, 20, 70);
    doc.text(`Payment Status: ${orderDetails.paymentStatus.toUpperCase()}`, 20, 80);

    doc.text("Shipping Address:", 20, 90);
    doc.text(`${orderDetails.addressInfo.address}, ${orderDetails.addressInfo.city}`, 20, 100);
    doc.text(`${orderDetails.addressInfo.postalCode}, ${orderDetails.addressInfo.country}`, 20, 110);
    doc.text(`Phone: ${orderDetails.addressInfo.phone}`, 20, 120);

    doc.text("Items:", 20, 140);
    let y = 150;
    orderDetails.cartItems.forEach((item, index) => {
      doc.text(`${index + 1}. ${item.title} (x${item.quantity}) - NPR ${item.price.toFixed(2)}`, 20, y);
      y += 10;
    });

    doc.text(`Total Amount: NPR ${orderDetails.totalAmount.toFixed(2)}`, 20, y + 10);
    doc.text("Thank you for shopping with FitMart!", 20, y + 30);

    doc.save(`FitMart_Receipt_${orderDetails._id}.pdf`);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (error || !orderDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error?.message || "Failed to load payment details"}</p>
            <Button onClick={() => navigate("/shop/home")} className="mt-4">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-green-600">Payment Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Thank you for your purchase!</p>
          <div className="space-y-2">
            <p><strong>Order ID:</strong> {orderDetails._id}</p>
            <p><strong>Date:</strong> {new Date(orderDetails.orderDate).toLocaleDateString()}</p>
            <p><strong>Payment Method:</strong> {orderDetails.paymentMethod.toUpperCase()}</p>
            <p><strong>Payment Status:</strong> {orderDetails.paymentStatus.toUpperCase()}</p>
            <p><strong>Total:</strong> NPR {orderDetails.totalAmount.toFixed(2)}</p>
            <p><strong>Shipping Address:</strong> {orderDetails.addressInfo.address}, {orderDetails.addressInfo.city}, {orderDetails.addressInfo.postalCode}</p>
          </div>
          <div className="space-y-2">
            <p><strong>Items:</strong></p>
            {orderDetails.cartItems.map((item) => (
              <p key={item.productId}>{item.title} (x{item.quantity}) - NPR {item.price.toFixed(2)}</p>
            ))}
          </div>
          <div className="flex gap-4 mt-6">
            <Button onClick={generatePDF}>Download Receipt</Button>
            <Button variant="outline" onClick={() => navigate("/shop/home")}>
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentSuccessPage;