import { Card, CardContent, CardFooter } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

// Updated category mapping for gym equipment
const categoryOptionsMap = {
  "strength-training": "Strength Training",
  "cardio-equipment": "Cardio Equipment",
  "weight-training": "Weight Training",
  accessories: "Accessories",
  "racks-and-cages": "Racks & Cages",
  benches: "Workout Benches",
  "plates-and-bars": "Weight Plates & Bars",
  dumbbells: "Dumbbells",
  kettlebells: "Kettlebells",
  "resistance-bands": "Resistance Bands",
  treadmills: "Treadmills",
  "exercise-bikes": "Exercise Bikes",
  ellipticals: "Ellipticals",
  "rowing-machines": "Rowing Machines",
}

function ShoppingProductTile({ product, onViewDetails, onAddToCart }) {
  return (
    <Card className="w-full max-w-sm mx-auto group overflow-hidden">
      <div onClick={() => onViewDetails(product?._id)} className="cursor-pointer">
        <div className="relative overflow-hidden">
          <img
            src={product?.image || "/placeholder.svg"}
            alt={product?.title}
            className="w-full h-[300px] object-cover rounded-t-lg transition-transform group-hover:scale-105"
          />
          {product?.totalStock === 0 ? (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Out Of Stock
            </Badge>
          ) : product?.totalStock < 10 ? (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Only {product?.totalStock} left
            </Badge>
          ) : product?.salePrice > 0 ? (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Sale
            </Badge>
          ) : null}

          {/* Equipment Type Badge */}
          <Badge variant="secondary" className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm">
            {categoryOptionsMap[product?.category] || "Equipment"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{product?.title}</h2>
          <div className="flex flex-col gap-2 mb-2">
            <span className="text-sm text-muted-foreground">{categoryOptionsMap[product?.category]}</span>
            {product?.specifications && (
              <ul className="text-sm text-muted-foreground space-y-1">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <li key={key} className="flex items-center gap-2">
                    <span className="font-medium">{key}:</span> {value}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            {product?.salePrice > 0 && <span className="text-2xl font-bold text-primary">${product.salePrice}</span>}
            <span
              className={`text-xl font-semibold ${product?.salePrice > 0 ? "line-through text-muted-foreground" : "text-primary"}`}
            >
              ${product?.price}
            </span>
            {product?.salePrice > 0 && (
              <Badge variant="secondary" className="ml-auto">
                Save ${(product.price - product.salePrice).toFixed(2)}
              </Badge>
            )}
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-4 pt-0">
        {product?.totalStock === 0 ? (
          <Button className="w-full" variant="secondary" disabled>
            Out Of Stock
          </Button>
        ) : (
          <Button onClick={() => onAddToCart(product?._id, product?.totalStock)} className="w-full">
            Add to Cart
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export default ShoppingProductTile;

