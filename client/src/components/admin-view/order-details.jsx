import { useState } from "react";
import { Button } from "../ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useDispatch, useSelector } from "react-redux";
import { updateOrderStatus } from "@/store/admin/order-slice";
import { getAllOrdersForAdmin } from "@/store/admin/order-slice";
import { toast } from "react-hot-toast";

function AdminOrderDetailsView({ orderDetails }) {
  const dispatch = useDispatch();
  const { pagination, filter } = useSelector((state) => state.adminOrder);
  const [orderStatus, setOrderStatus] = useState(orderDetails?.orderStatus || "pending");

  const handleUpdateOrderStatus = async () => {
    try {
      const actionResult = await dispatch(updateOrderStatus({
        id: orderDetails?._id,
        orderStatus,
      })).unwrap();
      toast.success(actionResult.message || "Order status updated successfully!");
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
    <DialogContent className="max-w-3xl p-6 bg-white rounded-lg shadow-lg border border-gray-200">
      <DialogHeader>
        <DialogTitle className="text-2xl font-bold text-gray-800 border-b pb-2">Order Details</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 mt-4">
        {/* Order Summary Section */}
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Order Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
            <p><span className="font-medium">Order ID:</span> {orderDetails?._id}</p>
            <p><span className="font-medium">Customer:</span> {orderDetails?.userId?.userName || "User Not Found"}</p>
            <p><span className="font-medium">Email:</span> {orderDetails?.userId?.email || "User Not Found"}</p>
            <p><span className="font-medium">Total Amount:</span> ${orderDetails?.totalAmount}</p>
            <p><span className="font-medium">Payment Method:</span> {orderDetails?.paymentMethod}</p>
            <p><span className="font-medium">Order Date:</span> {orderDetails?.orderDate.split("T")[0]}</p>
          </div>
        </div>

        {/* Shipping Address Section */}
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Shipping Address</h4>
          <div className="text-gray-600 space-y-1">
            <p>{orderDetails?.addressInfo?.address}</p>
            <p>
              {orderDetails?.addressInfo?.city}, {orderDetails?.addressInfo?.postalCode}, {orderDetails?.addressInfo?.country}
            </p>
            <p><span classPhone: className="font-medium">Phone:</span> {orderDetails?.addressInfo?.phone}</p>
            {orderDetails?.addressInfo?.notes && (
              <p><span className="font-medium">Notes:</span> {orderDetails?.addressInfo?.notes}</p>
            )}
          </div>
        </div>

        {/* Items Section */}
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Items</h4>
          <div className="space-y-3">
            {orderDetails?.cartItems?.map((item) => (
              <div key={item.productId} className="flex justify-between items-center p-2 bg-white rounded-md shadow hover:shadow-md transition-shadow duration-200">
                <div className="text-gray-600">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm">Quantity: {item.quantity}</p>
                </div>
                <p className="text-gray-800 font-semibold">${item.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Update Section */}
        <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
          <h4 className="text-lg font-semibold text-gray-700 mb-2">Update Order Status</h4>
          <div className="flex items-center gap-4">
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full md:w-1/2 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
              className="w-full md:w-auto bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200 px-4 py-2 rounded-md"
            >
              Update Status
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export default AdminOrderDetailsView;