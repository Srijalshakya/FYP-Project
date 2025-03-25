import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import ProductImageUpload from "@/components/admin-view/image-upload"
import { Button } from "@/components/ui/button"
import { addFeatureImage, getFeatureImages } from "@/store/common-slice"
import { Loader2 } from "lucide-react"

function AdminDashboard() {
  const [imageFile, setImageFile] = useState(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState("")
  const [imageLoadingState, setImageLoadingState] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const dispatch = useDispatch()
  const { featureImageList } = useSelector((state) => state.commonFeature)

  async function handleUploadFeatureImage() {
    if (!uploadedImageUrl) return

    try {
      setIsUploading(true)
      const result = await dispatch(addFeatureImage(uploadedImageUrl))

      if (result?.payload?.success) {
        await dispatch(getFeatureImages())
        setImageFile(null)
        setUploadedImageUrl("")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
    } finally {
      setIsUploading(false)
    }
  }

  useEffect(() => {
    dispatch(getFeatureImages())
  }, [dispatch])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Feature Images</h2>
        <p className="text-muted-foreground">Upload and manage your feature images</p>
      </div>

      {/* Upload Section */}
      <div className="rounded-lg border bg-card p-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <ProductImageUpload
              imageFile={imageFile}
              setImageFile={setImageFile}
              uploadedImageUrl={uploadedImageUrl}
              setUploadedImageUrl={setUploadedImageUrl}
              setImageLoadingState={setImageLoadingState}
              imageLoadingState={imageLoadingState}
              isCustomStyling={true}
            />
            <Button onClick={handleUploadFeatureImage} className="w-full" disabled={!uploadedImageUrl || isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Upload Image"
              )}
            </Button>
          </div>

          {/* Preview */}
          {uploadedImageUrl && (
            <div className="space-y-4">
              <h3 className="font-medium">Preview</h3>
              <div className="aspect-video relative rounded-lg border overflow-hidden bg-muted">
                <img
                  src={uploadedImageUrl || "/placeholder.svg"}
                  alt="Preview"
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg"
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Gallery</h3>
          <p className="text-sm text-muted-foreground">{featureImageList?.length || 0} images</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {featureImageList && featureImageList.length > 0 ? (
            featureImageList.map((item, index) => (
              <div key={index} className="group relative aspect-video rounded-lg border overflow-hidden bg-muted">
                <img
                  src={item.image || "/placeholder.svg"}
                  alt={`Feature image ${index + 1}`}
                  className="object-cover w-full h-full transition-transform group-hover:scale-105"
                  onError={(e) => {
                    e.target.src = "/placeholder.svg"
                  }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center h-60 rounded-lg border border-dashed text-center">
              <p className="text-lg font-medium">No images uploaded yet</p>
              <p className="text-sm text-muted-foreground">Upload your first feature image above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard;

