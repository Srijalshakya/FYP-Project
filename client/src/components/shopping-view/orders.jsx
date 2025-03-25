"use client"

import { useEffect, useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Dialog } from "../ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import ShoppingOrderDetailsView from "./order-details"
import { useDispatch, useSelector } from "react-redux"
import { getAllOrdersByUserId, getOrderDetails, resetOrderDetails } from "@/store/shop/order-slice"
import { Badge } from "../ui/badge"
import { Package } from "lucide-react"

// Status badge variants
const statusVariants = {
  confirmed: "bg-green-500 hover:bg-green-600",
  processing: "bg-blue-500 hover:bg-blue-600",
  shipped: "bg-purple-500 hover:bg-purple-600",
  delivered: "bg-green-600 hover:bg-green-700",
  cancelled: "bg-red-500 hover:bg-red-600",
  pending: "bg-yellow-500 hover:bg-yellow-600",
}

function ShoppingOrders() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { orderList, orderDetails } = useSelector((state) => state.shopOrder)

  function handleFetchOrderDetails(getId) {
    dispatch(getOrderDetails(getId))
  }

  useEffect(() => {
    if (user?.id) {
      dispatch(getAllOrdersByUserId(user.id))
    }
  }, [dispatch, user?.id])

  useEffect(() => {
    if (orderDetails !== null) setOpenDetailsDialog(true)
  }, [orderDetails])

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6" />
          <CardTitle>Your Equipment Orders</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {orderList && orderList.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Order ID</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-[100px]">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderList.map((orderItem) => (
                <TableRow key={orderItem?._id}>
                  <TableCell className="font-medium">#{orderItem?._id.slice(-6)}</TableCell>
                  <TableCell>
                    {orderItem?.items?.[0]?.title}
                    {orderItem?.items?.length > 1 && (
                      <span className="text-muted-foreground"> + {orderItem.items.length - 1} more</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(orderItem?.orderDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge className={`${statusVariants[orderItem?.orderStatus] || "bg-gray-500"}`}>
                      {orderItem?.orderStatus?.charAt(0).toUpperCase() + orderItem?.orderStatus?.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">${orderItem?.totalAmount.toFixed(2)}</TableCell>
                  <TableCell>
                    <Dialog
                      open={openDetailsDialog}
                      onOpenChange={() => {
                        setOpenDetailsDialog(false)
                        dispatch(resetOrderDetails())
                      }}
                    >
                      <Button variant="outline" size="sm" onClick={() => handleFetchOrderDetails(orderItem?._id)}>
                        Details
                      </Button>
                      <ShoppingOrderDetailsView orderDetails={orderDetails} />
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground">Start shopping for your gym equipment today!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default ShoppingOrders;

