import { useEffect, useState } from "react";
import CommonForm from "../common/form";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { addressFormControls } from "@/config";
import { useDispatch, useSelector } from "react-redux";
import {
  addNewAddress,
  deleteAddress,
  editaAddress,
  fetchAllAddresses,
} from "@/store/shop/address-slice";
import AddressCard from "./address-card";
import { useToast } from "../ui/use-toast";

// Make sure your address form config has a notes field
// If not, update your addressFormControls in the config file
const initialAddressFormData = {
  address: "",
  city: "",
  phone: "",
  pincode: "",
  notes: "No additional notes" // Default value to satisfy backend requirement
};

function Address({ setCurrentSelectedAddress, selectedId }) {
  const [formData, setFormData] = useState(initialAddressFormData);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { addressList } = useSelector((state) => state.shopAddress);
  const { toast } = useToast();

  function handleManageAddress(event) {
    event.preventDefault();

    if (addressList?.length >= 3 && currentEditedId === null) {
      setFormData(initialAddressFormData);
      toast({
        title: "You can add max 3 addresses",
        variant: "destructive",
      });
      return;
    }

    // Make sure notes is included with a default if empty
    const updatedFormData = {
      ...formData,
      notes: formData.notes || "No additional notes"
    };

    if (currentEditedId !== null) {
      dispatch(
        editaAddress({
          userId: user?.id,
          addressId: currentEditedId,
          formData: updatedFormData,
        })
      ).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllAddresses(user?.id));
          setCurrentEditedId(null);
          setFormData(initialAddressFormData);
          toast({
            title: "Address updated successfully",
          });
        } else {
          toast({
            title: "Failed to update address",
            description: data?.payload?.message || "Please try again",
            variant: "destructive"
          });
        }
      });
    } else {
      dispatch(
        addNewAddress({
          ...updatedFormData,
          userId: user?.id,
        })
      ).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllAddresses(user?.id)).then(() => {
            // If this is the first address, select it automatically
            if (!selectedId && addressList?.length === 0) {
              const newAddress = data?.payload?.data;
              if (newAddress && setCurrentSelectedAddress) {
                setCurrentSelectedAddress(newAddress);
              }
            }
          });
          setFormData(initialAddressFormData);
          toast({
            title: "Address added successfully",
          });
        } else {
          toast({
            title: "Failed to add address",
            description: data?.payload?.message || "Please try again",
            variant: "destructive"
          });
        }
      });
    }
  }

  function handleDeleteAddress(getCurrentAddress) {
    if (!getCurrentAddress?._id) {
      toast({
        title: "Invalid address",
        variant: "destructive",
      });
      return;
    }

    dispatch(
      deleteAddress({ userId: user?.id, addressId: getCurrentAddress._id })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchAllAddresses(user?.id));
        // If currently selected address is being deleted, clear it
        if (selectedId === getCurrentAddress._id && setCurrentSelectedAddress) {
          setCurrentSelectedAddress(null);
        }
        toast({
          title: "Address deleted successfully",
        });
      } else {
        toast({
          title: "Failed to delete address",
          description: data?.payload?.message || "Please try again",
          variant: "destructive"
        });
      }
    });
  }

  function handleEditAddress(getCurrentAddress) {
    setCurrentEditedId(getCurrentAddress?._id);
    setFormData({
      address: getCurrentAddress?.address || "",
      city: getCurrentAddress?.city || "",
      phone: getCurrentAddress?.phone || "",
      pincode: getCurrentAddress?.pincode || "",
      notes: getCurrentAddress?.notes || "No additional notes",
    });
  }

  function isFormValid() {
    return (
      formData.address?.trim() !== "" &&
      formData.city?.trim() !== "" &&
      formData.phone?.trim() !== "" &&
      formData.pincode?.trim() !== ""
    );
  }

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchAllAddresses(user.id)).then((data) => {
        // If there's at least one address and no address is selected yet
        if (data?.payload?.data?.length > 0 && !selectedId && setCurrentSelectedAddress) {
          setCurrentSelectedAddress(data.payload.data[0]);
        }
      });
    }
  }, [dispatch, user?.id, selectedId, setCurrentSelectedAddress]);

  return (
    <Card>
      <div className="mb-5 p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
        {addressList && addressList.length > 0
          ? addressList.map((singleAddressItem) => (
              <AddressCard
                key={singleAddressItem._id}
                selectedId={selectedId}
                handleDeleteAddress={handleDeleteAddress}
                addressInfo={singleAddressItem}
                handleEditAddress={handleEditAddress}
                setCurrentSelectedAddress={setCurrentSelectedAddress}
              />
            ))
          : null}
      </div>
      <CardHeader>
        <CardTitle>
          {currentEditedId !== null ? "Edit Address" : "Add New Address"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <CommonForm
          formControls={addressFormControls}
          formData={formData}
          setFormData={setFormData}
          buttonText={currentEditedId !== null ? "Edit" : "Add"}
          onSubmit={handleManageAddress}
          isBtnDisabled={!isFormValid()}
        />
      </CardContent>
    </Card>
  );
}

export default Address;