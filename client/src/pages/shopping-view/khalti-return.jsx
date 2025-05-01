import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

function KhaltiReturnPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const orderId = sessionStorage.getItem("currentOrderId")?.replace(/"/g, "");
  const pidx = searchParams.get("pidx");
  const status = searchParams.get("status");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Check if the payment was canceled by the user
        if (status === "User canceled" || status === "failed") {
          console.log("Payment canceled by user or failed.");
          toast({
            title: "Payment Canceled",
            description: "You canceled the payment. Redirecting to cancellation page.",
            variant: "destructive",
          });
          navigate(`/shop/payment-cancel?orderId=${orderId || "unknown"}&status=failed&reason=user_canceled`);
          return;
        }

        if (!pidx || !orderId) {
          console.log("Missing pidx or orderId. pidx:", pidx, "orderId:", orderId);
          toast({
            title: "Payment Processing Error",
            description: "Missing payment information. Redirecting to cancellation page.",
            variant: "destructive",
          });
          navigate(`/shop/payment-cancel?orderId=${orderId || "unknown"}&status=failed&reason=missing_payment_info`);
          return;
        }

        // Verify the payment with the backend
        const response = await axios.get(
          `${process.env.BACKEND_URI}/api/payment/complete-khalti-payment`,
          {
            params: {
              pidx,
              orderId,
              status: searchParams.get("status"),
              txnId: searchParams.get("txnId"),
              amount: searchParams.get("amount"),
              purchase_order_id: orderId,
              transaction_id: searchParams.get("transaction_id"),
            },
          }
        );

        console.log("Payment verification response:", response.data);

        if (response.data.success) {
          toast({
            title: "Payment Successful",
            description: "Your payment was successful!",
          });
          navigate(`/shop/payment-success?orderId=${orderId}`);
        } else {
          throw new Error(response.data.message || "Payment verification failed");
        }
      } catch (error) {
        console.error("Khalti payment verification error:", error.response?.data || error.message);
        toast({
          title: "Payment Processing Error",
          description: "Failed to verify payment. Redirecting to cancellation page.",
          variant: "destructive",
        });
        navigate(`/shop/payment-cancel?orderId=${orderId || "unknown"}&status=failed&reason=verification_failed`);
      }
    };

    verifyPayment();
  }, [navigate, toast, searchParams, orderId]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Processing payment...</p>
    </div>
  );
}

export default KhaltiReturnPage;