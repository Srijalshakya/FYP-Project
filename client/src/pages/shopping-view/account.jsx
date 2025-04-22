"use client"

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Address from "@/components/shopping-view/address";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@/components/ui/use-toast";
import { updateUser } from "@/store/auth-slice";
import { getOrderDetails, getAllOrdersByUserId } from "@/store/shop/order-slice";

// Modified ShoppingOrders component
function ModifiedShoppingOrders() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { orderList, orderDetails } = useSelector((state) => state.shopOrder);
  const { toast } = useToast();

  function handleFetchOrderDetails(getId) {
    dispatch(getOrderDetails(getId));
  }

  async function handleCancelOrder(orderId) {
    try {
      const response = await fetch(`/api/shop/order/cancel/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: "Order cancelled successfully",
        });
        dispatch(getAllOrdersByUserId(user.id));
      } else {
        console.error("Cancel failed:", result);
        toast({
          title: result.message || "Failed to cancel order",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Cancel error:", error);
      toast({
        title: "Error cancelling order",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    if (user?.id) {
      dispatch(getAllOrdersByUserId(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (orderDetails !== null) setOpenDetailsDialog(true);
  }, [orderDetails]);

  return (
    <div className="w-full">
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
              {orderList.map((orderItem) => (
                <tr key={orderItem?._id} className="border-b">
                  <td className="font-medium py-2">#{orderItem?._id.slice(-6)}</td>
                  <td>
                    {orderItem?.cartItems?.[0]?.title}
                    {orderItem?.cartItems?.length > 1 && (
                      <span className="text-muted-foreground"> + {orderItem.cartItems.length - 1} more</span>
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
                  <td className="text-right">${orderItem?.totalAmount.toFixed(2)}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFetchOrderDetails(orderItem?._id)}
                      >
                        Details
                      </Button>
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
              ))}
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
  );
}

function ShoppingAccount() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: user?.userName || "",
    currentPassword: "",
    newPassword: "",
  });

  // Check if user is logged in
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold mb-2">Please Log In</h3>
        <p className="text-muted-foreground">You need to log in to view your account settings and order history.</p>
      </div>
    );
  }

  const handleUpdateAccount = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/user/update/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Ensure cookies are sent
        body: JSON.stringify({
          userName: formData.username,
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        }),
      });
      const result = await response.json();
      if (result.success) {
        dispatch(updateUser({ userName: formData.username }));
        toast({
          title: "Account updated successfully",
        });
        setFormData({
          ...formData,
          currentPassword: "",
          newPassword: "",
        });
      } else {
        console.error("Update failed:", result);
        toast({
          title: result.message || "Failed to update account",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      toast({
        title: "Error updating account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col">
      <div className="relative h-[300px] w-full overflow-hidden">
        {/* Replace img with placeholder */}
        <div className="h-full w-full bg-gray-200" />
      </div>
      <div className="container mx-auto grid grid-cols-1 gap-8 py-8">
        <div className="flex flex-col rounded-lg border bg-background p-6 shadow-sm">
          <Tabs defaultValue="orders">
            <TabsList>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="orders">
              <ModifiedShoppingOrders />
            </TabsContent>
            <TabsContent value="address">
              <Address />
            </TabsContent>
            <TabsContent value="settings">
              <div className="max-w-md mt-4">
                <h3 className="text-lg font-semibold mb-4">Update Account</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleUpdateAccount}>Update Account</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default ShoppingAccount;