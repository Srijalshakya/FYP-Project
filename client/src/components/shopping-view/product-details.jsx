"use client"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Button } from "../ui/button"
import { Dialog, DialogContent } from "../ui/dialog"
import { Separator } from "../ui/separator"
import { Input } from "../ui/input"
import { useDispatch, useSelector } from "react-redux"
import { useToast } from "../ui/use-toast"
import { setProductDetails } from "@/store/shop/products-slice"
import StarRatingComponent from "../common/star-rating"
import { useEffect, useState } from "react"
import { addReview, getReviews } from "@/store/shop/review-slice"
import { Badge } from "../ui/badge"

function ProductDetailsDialog({ open, onOpenChange, productDetails, onAddToCart }) {
  const [reviewMsg, setReviewMsg] = useState("")
  const [rating, setRating] = useState(0)
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { reviews } = useSelector((state) => state.shopReview)
  const { toast } = useToast()

  function handleRatingChange(getRating) {
    setRating(getRating)
  }

  function handleDialogClose() {
    onOpenChange(false)
    dispatch(setProductDetails())
    setRating(0)
    setReviewMsg("")
  }

  function handleAddReview() {
    if (!user) {
      toast({
        title: "Please sign in to leave a review",
        variant: "destructive",
      })
      return
    }

    dispatch(
      addReview({
        productId: productDetails?._id,
        userId: user?.id,
        userName: user?.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      }),
    ).then((data) => {
      if (data.payload.success) {
        setRating(0)
        setReviewMsg("")
        dispatch(getReviews(productDetails?._id))
        toast({
          title: "Review added successfully!",
        })
      }
    })
  }

  useEffect(() => {
    if (productDetails?._id) {
      dispatch(getReviews(productDetails._id))
    }
  }, [dispatch, productDetails])

  const averageReview =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) / reviews.length
      : 0

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="grid md:grid-cols-2 gap-8 sm:p-12 max-w-[90vw] sm:max-w-[80vw] lg:max-w-[70vw]">
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={productDetails?.image || "/placeholder.svg"}
            alt={productDetails?.title}
            width={600}
            height={600}
            className="aspect-square w-full object-cover"
          />
          {productDetails?.totalStock === 0 ? (
            <Badge variant="destructive" className="absolute top-4 left-4">
              Out Of Stock
            </Badge>
          ) : productDetails?.totalStock < 10 ? (
            <Badge variant="destructive" className="absolute top-4 left-4">
              Only {productDetails.totalStock} left
            </Badge>
          ) : productDetails?.salePrice > 0 ? (
            <Badge variant="destructive" className="absolute top-4 left-4">
              Sale
            </Badge>
          ) : null}
        </div>
        <div className="flex flex-col h-full">
          <div className="flex-1">
            <div className="space-y-4">
              <h1 className="text-3xl font-extrabold">{productDetails?.title}</h1>

              {/* Equipment Specifications */}
              {productDetails?.specifications && (
                <div className="grid gap-2">
                  <h3 className="font-semibold text-lg">Specifications</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(productDetails.specifications).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium text-muted-foreground">{key}:</span>
                        <span>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-muted-foreground text-lg">{productDetails?.description}</p>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-3xl font-bold ${
                      productDetails?.salePrice > 0 ? "text-muted-foreground line-through" : "text-primary"
                    }`}
                  >
                    ${productDetails?.price}
                  </p>
                  {productDetails?.salePrice > 0 && (
                    <p className="text-3xl font-bold text-primary">${productDetails?.salePrice}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    <StarRatingComponent rating={averageReview} />
                  </div>
                  <span className="text-sm text-muted-foreground">({reviews?.length || 0} reviews)</span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              {productDetails?.totalStock === 0 ? (
                <Button className="w-full" disabled>
                  Out of Stock
                </Button>
              ) : (
                <Button className="w-full" onClick={() => onAddToCart(productDetails?._id, productDetails?.totalStock)}>
                  Add to Cart
                </Button>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6 max-h-[400px] overflow-auto">
            <h2 className="text-xl font-bold">Customer Reviews</h2>
            <div className="space-y-6">
              {reviews && reviews.length > 0 ? (
                reviews.map((reviewItem) => (
                  <div key={reviewItem.id} className="flex gap-4">
                    <Avatar className="w-10 h-10 border">
                      <AvatarFallback>{reviewItem?.userName[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{reviewItem?.userName}</h3>
                      </div>
                      <div className="flex items-center">
                        <StarRatingComponent rating={reviewItem?.reviewValue} />
                      </div>
                      <p className="text-muted-foreground">{reviewItem.reviewMessage}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No reviews yet</p>
              )}
            </div>

            <div className="space-y-4 pt-6">
              <h3 className="font-semibold">Write a Review</h3>
              <div className="flex gap-2">
                <StarRatingComponent rating={rating} handleRatingChange={handleRatingChange} />
                <span className="text-sm text-muted-foreground">
                  {rating > 0 ? `${rating} stars` : "Select rating"}
                </span>
              </div>
              <div className="space-y-2">
                <Input
                  name="reviewMsg"
                  value={reviewMsg}
                  onChange={(event) => setReviewMsg(event.target.value)}
                  placeholder="Share your experience with this equipment..."
                />
                <Button onClick={handleAddReview} disabled={!rating || reviewMsg.trim() === ""} className="w-full">
                  Submit Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ProductDetailsDialog;

