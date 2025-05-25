import { StarIcon } from "lucide-react";
import { Button } from "../ui/button";

function StarRatingComponent({ rating, handleRatingChange }) {
  console.log("Current rating in StarRatingComponent:", rating);

  return [1, 2, 3, 4, 5].map((star) => (
    <Button
      key={star} // Add key for React's rendering optimization
      className={`p-2 rounded-full transition-colors ${
        star <= rating
          ? "text-yellow-500 hover:bg-black"
          : "text-black hover:bg-primary hover:text-primary-foreground"
      }`}
      variant="outline"
      size="icon"
      onClick={() => {
        console.log("Star clicked:", star); // Debug log to confirm click
        if (handleRatingChange) {
          handleRatingChange(star);
        }
      }}
    >
      <StarIcon
        className={`w-6 h-6 ${
          star <= rating ? "fill-yellow-500" : "fill-black"
        }`}
      />
    </Button>
  ));
}

export default StarRatingComponent;