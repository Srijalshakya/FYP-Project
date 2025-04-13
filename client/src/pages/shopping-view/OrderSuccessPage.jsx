import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cashOnDelivery');
  const [shippingInfo, setShippingInfo] = useState({
    name: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  });

  // Fetch cart data when component mounts
  useEffect(() => {
    const fetchCart = async () => {
      try {
        // Try to get cart from API first
        const token = localStorage.getItem('token');
        const response = await fetch('/api/cart', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCart(data.items || []);
        } else {
          // If API fails, try to get cart from localStorage
          const storedCart = localStorage.getItem('cart');
          if (storedCart) {
            const parsedCart = JSON.parse(storedCart);
            setCart(parsedCart.items || []);
          }
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        // Try to get cart from localStorage as fallback
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          try {
            const parsedCart = JSON.parse(storedCart);
            setCart(parsedCart.items || []);
          } catch (e) {
            console.error('Error parsing stored cart:', e);
            setCart([]);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  // Calculate total whenever cart changes
  useEffect(() => {
    const calculateTotal = () => {
      if (!cart || cart.length === 0) {
        setTotal(0);
        return;
      }

      const sum = cart.reduce((acc, item) => {
        const price = parseFloat(item.price || 0);
        const quantity = parseInt(item.quantity || 1);
        return acc + (price * quantity);
      }, 0);

      setTotal(sum);
      
      // Also update localStorage cart with new total
      try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          localStorage.setItem('cart', JSON.stringify({
            ...parsedCart,
            items: cart,
            totalAmount: sum
          }));
        }
      } catch (e) {
        console.error('Error updating stored cart:', e);
      }
    };

    calculateTotal();
  }, [cart]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== itemId));
  };

  const handlePlaceOrder = async () => {
    try {
      // Validate shipping info
      const requiredFields = ['name', 'address', 'city', 'postalCode', 'phone'];
      const missingFields = requiredFields.filter(field => !shippingInfo[field]);
      
      if (missingFields.length > 0) {
        alert(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Create order payload
      const orderPayload = {
        items: cart,
        totalAmount: total,
        shippingInfo,
        paymentMethod
      };

      // Send order to API
      const token = localStorage.getItem('token');
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update localStorage with order info
        localStorage.setItem('latestOrder', JSON.stringify({
          orderId: data.orderId || data.id,
          totalAmount: total,
          paymentMethod
        }));
        
        // Clear cart in localStorage
        localStorage.setItem('cart', JSON.stringify({ items: [], totalAmount: 0 }));
        
        // Navigate to success page
        navigate(`/order-success/${data.orderId || data.id}`);
      } else {
        throw new Error('Failed to place order');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('There was an error placing your order. Please try again.');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items & Shipping Info - 2/3 width on large screens */}
        <div className="lg:col-span-2">
          {/* Cart Items */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4">Cart Items</h2>
            
            {cart.length === 0 ? (
              <p className="text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center border-b pb-4">
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4 flex-grow">
                      <h3 className="font-medium">{item.name}</h3>
                      <p className="text-gray-500 text-sm">{formatCurrency(item.price)}</p>
                    </div>
                    
                    <div className="flex items-center">
                      <button 
                        onClick={() => handleQuantityChange(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 rounded-full border flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="mx-2">{item.quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="ml-4 text-right">
                      <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                      <button 
                        onClick={() => handleRemoveItem(item.id)} 
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Shipping Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  name="name" 
                  value={shippingInfo.name} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={shippingInfo.phone} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-gray-700 mb-1">Address</label>
                <input 
                  type="text" 
                  name="address" 
                  value={shippingInfo.address} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">City</label>
                <input 
                  type="text" 
                  name="city" 
                  value={shippingInfo.city} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1">Postal Code</label>
                <input 
                  type="text" 
                  name="postalCode" 
                  value={shippingInfo.postalCode} 
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:outline-none" 
                  required
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Order Summary - 1/3 width on large screens */}
        <div>
          <div className="bg-white p-6 rounded-lg shadow-sm sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Subtotal:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Shipping:</span>
                <span>Free</span>
              </div>
              
              <div className="flex justify-between py-2 pt-3">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-3">Payment Method</h3>
              
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="cashOnDelivery"
                    checked={paymentMethod === 'cashOnDelivery'}
                    onChange={() => setPaymentMethod('cashOnDelivery')}
                    className="mr-2"
                  />
                  Cash on Delivery
                </label>
                
                <label className="flex items-center">
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value="creditCard"
                    checked={paymentMethod === 'creditCard'}
                    onChange={() => setPaymentMethod('creditCard')}
                    className="mr-2"
                  />
                  Credit Card (coming soon)
                </label>
              </div>
            </div>
            
            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0}
              className={`w-full mt-6 py-3 rounded-lg font-medium text-white 
                ${cart.length === 0 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90'
                }`}
            >
              Place Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;