import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { getAllOrdersByUserId } from "@/store/shop/order-slice";

// Conversion rate: 1 USD = 135 NPR
const USD_TO_NPR_RATE = 135;

// Helper function to convert USD to NPR
const convertUsdToNpr = (priceInUsd) => {
  return Number((priceInUsd * USD_TO_NPR_RATE).toFixed(2));
};

function OrderHistory() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { orderList, isLoading, error } = useSelector((state) => state.shopOrder);
  const { toast } = useToast();

  // Fetch orders when the component mounts
  useEffect(() => {
    if (user?.id) {
      dispatch(getAllOrdersByUserId(user.id));
    }
  }, [dispatch, user?.id]);

  // Handle order cancellation
  async function handleCancelOrder(orderId) {
    try {
      const response = await fetch(`http://localhost:5000/api/shop/order/cancel/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Order cancelled successfully",
        });
        dispatch(getAllOrdersByUserId(user.id)); // Refresh order list after cancellation
      } else {
        toast({
          title: result.message || "Failed to cancel order",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error cancelling order",
        variant: "destructive",
      });
    }
  }

  // Check if user is authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Please Log In</h3>
          <p className="text-muted-foreground">
            You need to log in to view your order history.
          </p>
        </div>
      </div>
    );
  }

  // Display loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto py-12 text-center">
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto py-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Error Loading Orders</h3>
          <p className="text-muted-foreground">{error.message || "Something went wrong."}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => dispatch(getAllOrdersByUserId(user.id))}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Render order history
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Order History</h1>
        {orderList && orderList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-[100px] text-left">Order ID</th>
                  <th className="text-left">Equipment</th>
                  <th className="text-left">Order Date</th>
                  <th className="text-left">Status</th>
                  <th className="text-right">Total</th>
                  <th className="w-[150px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((orderItem) => {
                  // Convert totalAmount from USD to NPR for display
                  const displayTotal = convertUsdToNpr(orderItem?.totalAmount);

                  return (
                    <tr key={orderItem?._id} className="border-b">
                      <td className="font-medium py-2">#{orderItem?._id.slice(-6)}</td>
                      <td>
                        {orderItem?.cartItems?.[0]?.title}
                        {orderItem?.cartItems?.length > 1 && (
                          <span className="text-muted-foreground">
                            {" "}
                            + {orderItem.cartItems.length - 1} more
                          </span>
                        )}
                      </td>
                      <td>{new Date(orderItem?.orderDate).toLocaleDateString()}</td>
                      <td>
                        <span
                          className={`py-1 px-3 rounded text-white ${
                            orderItem?.orderStatus === "confirmed"
                              ? "bg-green-500"
                              : orderItem?.orderStatus === "cancelled"
                              ? "bg-red-500"
                              : "bg-gray-500"
                          }`}
                        >
                          {orderItem?.orderStatus?.charAt(0).toUpperCase() +
                            orderItem?.orderStatus?.slice(1)}
                        </span>
                      </td>
                      <td className="text-right">NPR {displayTotal.toFixed(2)}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          {orderItem?.orderStatus === "pending" && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOrder(orderItem?._id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground">Start shopping for your gym equipment today!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderHistory;