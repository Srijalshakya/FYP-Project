import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import UserCartItemsContent from "./cart-items-content";

function UserCartWrapper({ cartItems, setOpenCartSheet }) {
  const navigate = useNavigate();

  // Calculate original total (without discount)
  const originalTotal =
    cartItems && cartItems.length > 0
      ? cartItems.reduce(
          (sum, currentItem) =>
            sum + (currentItem?.originalPrice || currentItem?.price) * currentItem?.quantity,
          0
        )
      : 0;

  // Calculate total with discounts applied
  const totalCartAmount =
    cartItems && cartItems.length > 0
      ? cartItems.reduce(
          (sum, currentItem) =>
            sum +
            (currentItem?.discountedPrice !== null && currentItem?.discountedPrice !== undefined
              ? currentItem.discountedPrice
              : currentItem?.salePrice > 0
              ? currentItem.salePrice
              : currentItem?.price) *
              currentItem?.quantity,
          0
        )
      : 0;

  // Calculate total discount
  const totalDiscount = originalTotal - totalCartAmount;

  return (
    <SheetContent className="sm:max-w-md">
      <SheetHeader>
        <SheetTitle>Your Cart</SheetTitle>
      </SheetHeader>
      <div className="mt-8 space-y-4">
        {cartItems && cartItems.length > 0
          ? cartItems.map((item) => <UserCartItemsContent key={item.productId} cartItem={item} />)
          : null}
      </div>
      <div className="mt-8 space-y-4">
        {totalDiscount > 0 && (
          <div className="flex justify-between">
            <span className="font-bold">Discount</span>
            <span className="font-bold text-green-600">-${totalDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="font-bold">Total</span>
          <span className="font-bold">${totalCartAmount.toFixed(2)}</span>
        </div>
      </div>
      <Button
        onClick={() => {
          navigate("/shop/checkout");
          setOpenCartSheet(false);
        }}
        className="w-full mt-6"
      >
        Checkout
      </Button>
    </SheetContent>
  );
}

export default UserCartWrapper;