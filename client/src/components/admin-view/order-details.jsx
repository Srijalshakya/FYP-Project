import { useState } from "react";
import { Button } from "../ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { updateOrderStatus } from "@/store/admin/order-slice";
import { getAllOrdersForAdmin } from "@/store/admin/order-slice"; // Import the action to refetch orders
import { toast } from "react-hot-toast"; // Assuming you're using react-hot-toast for toasts

function AdminOrderDetailsView({ orderDetails }) {
  const dispatch = useDispatch();
  const { pagination, filter } = useSelector((state) => state.adminOrder); // Get pagination and filter from state
  const [orderStatus, setOrderStatus] = useState(orderDetails?.orderStatus || "pending");

  const handleUpdateOrderStatus = async () => {
    try {
      const actionResult = await dispatch(updateOrderStatus({
        id: orderDetails?._id,
        orderStatus,
      })).unwrap(); // Use unwrap to handle the promise and catch errors

      toast.success(actionResult.message || "Order status updated successfully!");

      // Refetch the orders list after a successful update
      await dispatch(getAllOrdersForAdmin({
        page: pagination?.currentPage || 1,
        filter: filter || "all",
      }));

    } catch (error) {
      toast.error(error.message || "Failed to update order status. Please try again.");
      console.error("Update order status error:", error);
    }
  };

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>Order Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Order ID: {orderDetails?._id}</h4>
          <p>Customer: {orderDetails?.userId?.userName || "User Not Found"}</p>
          <p>Email: {orderDetails?.userId?.email || "User Not Found"}</p>
          <p>Total Amount: ${orderDetails?.totalAmount}</p>
          <p>Payment Method: {orderDetails?.paymentMethod}</p>
          <p>Order Date: {orderDetails?.orderDate.split("T")[0]}</p>
        </div>
        <div>
          <h4 className="font-semibold">Shipping Address</h4>
          <p>{orderDetails?.addressInfo?.address}</p>
          <p>
            {orderDetails?.addressInfo?.city}, {orderDetails?.addressInfo?.postalCode}, {orderDetails?.addressInfo?.country}
          </p>
          <p>Phone: {orderDetails?.addressInfo?.phone}</p>
          {orderDetails?.addressInfo?.notes && <p>Notes: {orderDetails?.addressInfo?.notes}</p>}
        </div>
        <div>
          <h4 className="font-semibold">Items</h4>
          {orderDetails?.cartItems?.map((item) => (
            <div key={item.productId} className="flex justify-between">
              <div>
                <p>{item.title}</p>
                <p>Quantity: {item.quantity}</p>
              </div>
              <p>${item.price}</p>
            </div>
          ))}
        </div>
        <div>
          <h4 className="font-semibold">Update Order Status</h4>
          <select
            value={orderStatus}
            onChange={(e) => setOrderStatus(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="inShipping">In Shipping</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
            <option value="rejected">Rejected</option>
            <option value="confirmed">Confirmed</option>
            <option value="inProcess">In Process</option>
          </select>
          <Button
            onClick={handleUpdateOrderStatus}
            className="mt-2"
          >
            Update Status
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}

export default AdminOrderDetailsView;