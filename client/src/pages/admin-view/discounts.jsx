"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/components/ui/use-toast";
import {
  addNewDiscount,
  fetchAllDiscounts,
  editDiscount,
  deleteDiscount,
} from "@/store/admin/discount-slice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const categories = [
  { id: "strength-training", label: "Strength Training" },
  { id: "cardio-equipment", label: "Cardio Equipment" },
  { id: "weight-training", label: "Weight Training" },
  { id: "accessories", label: "Accessories" },
];

const initialFormData = {
  categories: [],
  percentage: "",
  description: "",
  startDate: "",
  endDate: "",
};

export default function AdminDiscounts() {
  const [openCreateDiscountDialog, setOpenCreateDiscountDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [currentEditedId, setCurrentEditedId] = useState(null);

  const { discountList, isLoading } = useSelector((state) => state.adminDiscount);
  const dispatch = useDispatch();
  const { toast } = useToast();

  function handleInputChange(name, value) {
    if (name === "categories") {
      setFormData((prev) => {
        const updatedCategories = prev.categories.includes(value)
          ? prev.categories.filter((cat) => cat !== value)
          : [...prev.categories, value];
        return { ...prev, categories: updatedCategories };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  }

  function onSubmit(event) {
    event.preventDefault();

    if (currentEditedId !== null) {
      dispatch(
        editDiscount({
          id: currentEditedId,
          formData,
        })
      ).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllDiscounts());
          setFormData(initialFormData);
          setOpenCreateDiscountDialog(false);
          setCurrentEditedId(null);
          toast({
            title: "Discount updated successfully",
          });
        }
      });
    } else {
      dispatch(addNewDiscount(formData)).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllDiscounts());
          setOpenCreateDiscountDialog(false);
          setFormData(initialFormData);
          toast({
            title: "Discount added successfully",
          });
        }
      });
    }
  }

  function handleDelete(discountId) {
    dispatch(deleteDiscount(discountId)).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchAllDiscounts());
        toast({
          title: "Discount deleted successfully",
        });
      }
    });
  }

  function isFormValid() {
    return (
      formData.categories.length > 0 &&
      formData.percentage &&
      formData.description &&
      formData.startDate &&
      formData.endDate
    );
  }

  useEffect(() => {
    dispatch(fetchAllDiscounts());
  }, [dispatch]);

  return (
    <div className="container mx-auto p-6 bg-background">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Manage Discounts</h1>
          <p className="text-muted-foreground mt-1">Create and manage discounts for your products</p>
        </div>
        <Button
          onClick={() => setOpenCreateDiscountDialog(true)}
          size="lg"
          className="bg-primary hover:bg-primary/90"
        >
          Add New Discount
        </Button>
      </div>

      <div className="overflow-x-auto">
        {discountList && discountList.length > 0 ? (
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="text-left p-4">Categories</th>
                <th className="text-left p-4">Percentage</th>
                <th className="text-left p-4">Description</th>
                <th className="text-left p-4">Start Date</th>
                <th className="text-left p-4">End Date</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {discountList.map((discount) => (
                <tr key={discount._id} className="border-b">
                  <td className="p-4">
                    {discount.categories.map((cat) => (
                      <Badge key={cat} className="mr-1">
                        {categories.find((c) => c.id === cat)?.label || cat}
                      </Badge>
                    ))}
                  </td>
                  <td className="p-4">{discount.percentage}%</td>
                  <td className="p-4">{discount.description}</td>
                  <td className="p-4">{new Date(discount.startDate).toLocaleDateString()}</td>
                  <td className="p-4">{new Date(discount.endDate).toLocaleDateString()}</td>
                  <td className="p-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="mr-2"
                      onClick={() => {
                        setFormData({
                          categories: discount.categories,
                          percentage: discount.percentage,
                          description: discount.description,
                          startDate: new Date(discount.startDate).toISOString().split("T")[0],
                          endDate: new Date(discount.endDate).toISOString().split("T")[0],
                        });
                        setCurrentEditedId(discount._id);
                        setOpenCreateDiscountDialog(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(discount._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 bg-muted/30 rounded-lg border-2 border-dashed">
            <p className="text-xl font-semibold text-primary">No Discounts Listed</p>
            <p className="text-muted-foreground mt-2">Add your first discount to get started</p>
          </div>
        )}
      </div>

      <Sheet
        open={openCreateDiscountDialog}
        onOpenChange={() => {
          setOpenCreateDiscountDialog(false);
          setCurrentEditedId(null);
          setFormData(initialFormData);
        }}
      >
        <SheetContent side="right" className="overflow-auto w-full max-w-2xl">
          <SheetHeader>
            <SheetTitle className="text-2xl">
              {currentEditedId !== null ? "Edit Discount" : "Add New Discount"}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={onSubmit} className="space-y-8 py-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Categories</Label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={category.id}
                        checked={formData.categories.includes(category.id)}
                        onCheckedChange={() => handleInputChange("categories", category.id)}
                      />
                      <label htmlFor={category.id}>{category.label}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="percentage">Discount Percentage (%)</Label>
                <Input
                  id="percentage"
                  type="number"
                  placeholder="Enter discount percentage (1-100)"
                  value={formData.percentage}
                  onChange={(e) => handleInputChange("percentage", e.target.value)}
                  min="1"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Enter discount description (e.g., Spring Sale on Strength Equipment!)"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={!isFormValid()}>
              {currentEditedId !== null ? "Update Discount" : "Add Discount"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}