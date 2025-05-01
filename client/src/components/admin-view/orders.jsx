import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog } from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import AdminOrderDetailsView from "./order-details";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersForAdmin,
  getOrderDetailsForAdmin,
  resetOrderDetails,
  setFilter, // Import setFilter action
} from "@/store/admin/order-slice";
import { Badge } from "../ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "react-hot-toast"; // For error messages

function AdminOrdersView() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { orderList, orderDetails, pagination, filter, isLoading, error } = useSelector((state) => state.adminOrder);
  const dispatch = useDispatch();

  function handleFetchOrderDetails(getId) {
    dispatch(getOrderDetailsForAdmin(getId));
  }

  useEffect(() => {
    dispatch(getAllOrdersForAdmin({ page: currentPage, filter }));
  }, [dispatch, currentPage, filter]);

  useEffect(() => {
    if (orderDetails !== null) setOpenDetailsDialog(true);
  }, [orderDetails]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Use backend pagination data
  const totalPages = pagination?.totalPages || 1;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>All Orders</CardTitle>
        <div className="flex justify-between items-center mt-4">
          <Select
            value={filter}
            onValueChange={(value) => {
              dispatch(setFilter(value)); // Update filter in Redux
              setCurrentPage(1); // Reset to page 1 when filter changes
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter orders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="recent">Recent Orders (Last 7 Days)</SelectItem>
              <SelectItem value="old">Old Orders (&gt; 7 Days)</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage((prev) => prev - 1)}
            >
              Previous
            </Button>
            <Button
              disabled={currentPage === totalPages || !orderList?.length || isLoading}
              onClick={() => setCurrentPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center">Loading orders...</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead>
                    <span className="sr-only">Details</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orderList && orderList.length > 0 ? (
                  orderList.map((orderItem) => {
                    console.log("Order item:", JSON.stringify(orderItem, null, 2));
                    return (
                      <TableRow key={orderItem?._id}>
                        <TableCell>{orderItem?._id}</TableCell>
                        <TableCell>{orderItem?.userId?.userName || "User Not Found"}</TableCell>
                        <TableCell>{orderItem?.userId?.email || "User Not Found"}</TableCell>
                        <TableCell>${orderItem?.totalAmount}</TableCell>
                        <TableCell>{orderItem?.paymentMethod}</TableCell>
                        <TableCell>{orderItem?.orderDate.split("T")[0]}</TableCell>
                        <TableCell>
                          <Badge
                            className={`py-1 px-3 ${
                              orderItem?.orderStatus === "confirmed"
                                ? "bg-green-500"
                                : orderItem?.orderStatus === "cancelled"
                                ? "bg-red-500"
                                : orderItem?.orderStatus === "rejected"
                                ? "bg-red-600"
                                : "bg-black"
                            }`}
                          >
                            {orderItem?.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog
                            open={openDetailsDialog}
                            onOpenChange={() => {
                              setOpenDetailsDialog(false);
                              dispatch(resetOrderDetails());
                            }}
                          >
                            <Button
                              onClick={() => handleFetchOrderDetails(orderItem?._id)}
                            >
                              View Details
                            </Button>
                            <AdminOrderDetailsView orderDetails={orderDetails} />
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {orderList?.length || 0} of {pagination?.totalOrders || 0} orders
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminOrdersView;