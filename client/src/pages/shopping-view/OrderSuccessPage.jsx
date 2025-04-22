import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const OrderSuccessPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState({
    orderId: '',
    estimatedDelivery: '',
    totalAmount: 0,
    paymentMethod: ''
  });
  
  useEffect(() => {
    // Get current date + 7 days for estimated delivery (fallback)
    const defaultDeliveryDate = new Date();
    defaultDeliveryDate.setDate(defaultDeliveryDate.getDate() + 7);
    const defaultDeliveryString = defaultDeliveryDate.toLocaleDateString('en-US', {
      month: 'numeric', 
      day: 'numeric',
      year: 'numeric'
    });
    
    // Try to get order info from localStorage first
    const latestOrder = localStorage.getItem('latestOrder');
    if (latestOrder) {
      try {
        const parsedOrder = JSON.parse(latestOrder);
        setOrderData({
          orderId: parsedOrder.orderId || orderId || 'ORD-199411',
          estimatedDelivery: parsedOrder.estimatedDelivery || defaultDeliveryString,
          totalAmount: parsedOrder.totalAmount || 0,
          paymentMethod: parsedOrder.paymentMethod || 'cod'
        });
      } catch (e) {
        console.error('Error parsing order data:', e);
        // Fallback values
        setOrderData({
          orderId: orderId || 'ORD-199411',
          estimatedDelivery: defaultDeliveryString,
          totalAmount: 0,
          paymentMethod: 'cod'
        });
      }
    } else {
      // If nothing in localStorage, use params and defaults
      setOrderData({
        orderId: orderId || 'ORD-199411',
        estimatedDelivery: defaultDeliveryString,
        totalAmount: 0,
        paymentMethod: 'cod'
      });
    }
  }, [orderId]);

  const handleReturnToHome = () => {
    navigate('/shop/home');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-green-500"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>
        
        {/* Success message */}
        <h1 className="text-2xl font-bold text-center mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-600 text-center mb-8">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        
        {/* Order details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-center font-medium mb-4">Order Details</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Order #:</span>
              <span className="font-medium">{orderData.orderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Delivery:</span>
              <span className="font-medium">{orderData.estimatedDelivery}</span>
            </div>
          </div>
        </div>
        
        {/* Return to home button */}
        <button
          onClick={handleReturnToHome}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md flex items-center justify-center transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="mr-2"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          Return to Home
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessPage;