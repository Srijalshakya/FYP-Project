"use client"

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import ProductImageUpload from "@/components/admin-view/image-upload"
import AdminProductTile from "@/components/admin-view/product-tile"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { addNewProduct, deleteProduct, editProduct, fetchAllProducts } from "@/store/admin/products-slice"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categories = [
  { id: "strength-training", label: "Strength Training" },
  { id: "cardio-equipment", label: "Cardio Equipment" },
  { id: "weight-training", label: "Weight Training" },
  { id: "accessories", label: "Accessories" },
]

const initialFormData = {
  image: null,
  title: "",
  description: "",
  category: "",
  price: "",
  salePrice: "",
  totalStock: "",
  averageReview: 0,
}

export default function AdminProducts() {
  const [openCreateProductsDialog, setOpenCreateProductsDialog] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [imageFile, setImageFile] = useState(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState("")
  const [imageLoadingState, setImageLoadingState] = useState(false)
  const [currentEditedId, setCurrentEditedId] = useState(null)

  const { productList } = useSelector((state) => state.adminProducts)
  const dispatch = useDispatch()
  const { toast } = useToast()

  function handleInputChange(name, value) {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  function onSubmit(event) {
    event.preventDefault()

    const productData = {
      ...formData,
      image: uploadedImageUrl || formData.image,
    }

    if (currentEditedId !== null) {
      dispatch(
        editProduct({
          id: currentEditedId,
          formData: productData,
        }),
      ).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllProducts())
          setFormData(initialFormData)
          setOpenCreateProductsDialog(false)
          setCurrentEditedId(null)
          toast({
            title: "Equipment updated successfully",
          })
        }
      })
    } else {
      dispatch(addNewProduct(productData)).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllProducts())
          setOpenCreateProductsDialog(false)
          setImageFile(null)
          setFormData(initialFormData)
          toast({
            title: "Equipment added successfully",
          })
        }
      })
    }
  }

  function handleDelete(getCurrentProductId) {
    dispatch(deleteProduct(getCurrentProductId)).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchAllProducts())
        toast({
          title: "Equipment deleted successfully",
        })
      }
    })
  }

  function isFormValid() {
    return Object.keys(formData)
      .filter((key) => key !== "averageReview" && key !== "salePrice")
      .every((key) => formData[key] !== "")
  }

  useEffect(() => {
    dispatch(fetchAllProducts())
  }, [dispatch])

  return (
    <div className="container mx-auto p-6 bg-background">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">FitMart Equipment</h1>
          <p className="text-muted-foreground mt-1">Manage your gym equipment inventory</p>
        </div>
        <Button onClick={() => setOpenCreateProductsDialog(true)} size="lg" className="bg-primary hover:bg-primary/90">
          Add New Equipment
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {productList && productList.length > 0 ? (
          productList.map((productItem) => (
            <AdminProductTile
              key={productItem._id}
              setFormData={setFormData}
              setOpenCreateProductsDialog={setOpenCreateProductsDialog}
              setCurrentEditedId={setCurrentEditedId}
              product={productItem}
              handleDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-muted/30 rounded-lg border-2 border-dashed">
            <p className="text-xl font-semibold text-primary">No Equipment Listed</p>
            <p className="text-muted-foreground mt-2">Add your first piece of equipment to get started</p>
          </div>
        )}
      </div>
      <Sheet
        open={openCreateProductsDialog}
        onOpenChange={() => {
          setOpenCreateProductsDialog(false)
          setCurrentEditedId(null)
          setFormData(initialFormData)
          setImageFile(null)
          setUploadedImageUrl("")
        }}
      >
        <SheetContent side="right" className="overflow-auto w-full max-w-2xl">
          <SheetHeader>
            <SheetTitle className="text-2xl">
              {currentEditedId !== null ? "Edit Equipment" : "Add New Equipment"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={onSubmit} className="space-y-8 py-8">
            <ProductImageUpload
              imageFile={imageFile}
              setImageFile={setImageFile}
              uploadedImageUrl={uploadedImageUrl}
              setUploadedImageUrl={setUploadedImageUrl}
              setImageLoadingState={setImageLoadingState}
              imageLoadingState={imageLoadingState}
              isEditMode={currentEditedId !== null}
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Equipment Name</Label>
                <Input
                  id="title"
                  placeholder="Enter equipment name"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter equipment description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Regular Price ($)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="Enter regular price"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salePrice">Sale Price ($)</Label>
                <Input
                  id="salePrice"
                  type="number"
                  placeholder="Enter sale price (optional)"
                  value={formData.salePrice}
                  onChange={(e) => handleInputChange("salePrice", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalStock">Available Stock</Label>
                <Input
                  id="totalStock"
                  type="number"
                  placeholder="Enter total stock"
                  value={formData.totalStock}
                  onChange={(e) => handleInputChange("totalStock", e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!isFormValid() || imageLoadingState}>
              {currentEditedId !== null ? "Update Equipment" : "Add Equipment"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}

