import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import UserCartItemsContent from "./cart-items-content";

function UserCartWrapper({ cartItems, setOpenCartSheet }) {
  const navigate = useNavigate();

  const originalTotal =
    cartItems && cartItems.length > 0
      ? cartItems.reduce(
          (sum, currentItem) =>
            sum + (currentItem?.originalPrice || currentItem?.price) * currentItem?.quantity,
          0
        )
      : 0;

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

  const totalDiscount = originalTotal - totalCartAmount;

  return (
    <SheetContent className="sm:max-w-md bg-white flex flex-col h-full">
      <SheetHeader className="border-b pb-4">
        <SheetTitle className="text-2xl font-bold text-gray-800">Your Cart</SheetTitle>
      </SheetHeader>
      
      {/* Scrollable Cart Items Section */}
      <div className="mt-6 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        {cartItems && cartItems.length > 0 ? (
          <div className="space-y-4 px-4">
            {cartItems.map((item) => (
              <div
                key={item.productId}
                className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <UserCartItemsContent cartItem={item} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm">Add some items to get started!</p>
          </div>
        )}
      </div>

      {/* Total and Checkout Section */}
      {cartItems && cartItems.length > 0 && (
        <div className="mt-6 p-4 border-t bg-white shadow-sm">
          <div className="space-y-3">
            {totalDiscount > 0 && (
              <div className="flex justify-between text-gray-700">
                <span className="font-semibold">Discount</span>
                <span className="font-semibold text-green-600">
                  -${totalDiscount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-gray-800">
              <span className="font-bold text-lg">Total</span>
              <span className="font-bold text-lg">${totalCartAmount.toFixed(2)}</span>
            </div>
          </div>
          <Button
            onClick={() => {
              navigate("/shop/checkout");
              setOpenCartSheet(false);
            }}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200 py-3 rounded-lg"
          >
            Checkout
          </Button>
        </div>
      )}
    </SheetContent>
  );
}

export default UserCartWrapper;