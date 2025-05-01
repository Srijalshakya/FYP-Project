import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify"; // Replaced useToast with react-toastify
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function PaymentCancelPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const status = searchParams.get("status");
  const reason = searchParams.get("reason");

  useEffect(() => {
    console.log("PaymentCancelPage query params:", { orderId, status, reason });
    toast.error(
      reason
        ? `Payment Cancelled - Reason: ${reason.replace(/_/g, " ")}`
        : "Your payment was cancelled. Please try again or choose another payment method."
    );
  }, [reason]); // Removed toast from dependencies

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-red-600">Payment Cancelled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Your payment was not completed.</p>
          {orderId && <p><strong>Order ID:</strong> {orderId}</p>}
          {status && <p><strong>Status:</strong> {status}</p>}
          {reason && <p><strong>Reason:</strong> {reason.replace(/_/g, " ")}</p>}
          <p>Please try again or select a different payment method.</p>
          <div className="flex gap-4 mt-6">
            <Button onClick={() => navigate("/shop/checkout")}>Try Again</Button>
            <Button variant="outline" onClick={() => navigate("/shop/home")}>
              Return to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PaymentCancelPage;