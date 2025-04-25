import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

function KhaltiReturnPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const orderId = sessionStorage.getItem("currentOrderId")?.replace(/"/g, "");

  useEffect(() => {
    console.log("KhaltiReturnPage accessed unexpectedly. Redirecting to cancel page as fallback.");
    toast({
      title: "Payment Processing Error",
      description: "Redirecting to cancellation page as a fallback.",
      variant: "destructive",
    });
    navigate(`/shop/payment-cancel?orderId=${orderId || "unknown"}&status=failed&reason=unexpected_access`);
  }, [navigate, toast, orderId]);

  return (
    <div className="flex justify-center items-center h-screen">
      <p>Processing payment...</p>
    </div>
  );
}

export default KhaltiReturnPage;