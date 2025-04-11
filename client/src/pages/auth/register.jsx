import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { registerUser } from "@/store/auth-slice";
import { registerFormControls } from "@/config";
import CommonForm from "@/components/common/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState = {
  userName: "",
  email: "",
  password: "",
};

const AuthRegister = () => {
  // Create refs to preserve values between renders
  const emailRef = useRef("");
  const userNameRef = useRef("");
  
  const [formData, setFormData] = useState(initialState);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showOtpInput, setShowOtpInput] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Update refs when formData changes
  useEffect(() => {
    if (formData.email) {
      emailRef.current = formData.email;
    }
    if (formData.userName) {
      userNameRef.current = formData.userName;
    }
  }, [formData]);

  const validateForm = () => {
    const errors = {};
    
    if (!formData.userName.trim()) {
      errors.userName = "Username is required";
    } else if (formData.userName.length < 3) {
      errors.userName = "Username must be at least 3 characters";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    console.log("Form submitted");
    
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    if (formSubmitting) return;
    setFormSubmitting(true);

    // Store email in ref before making the request
    emailRef.current = formData.email;
    userNameRef.current = formData.userName;

    try {
      console.log("Sending registration request to:", `${API_URL}/auth/register`);
      console.log("With data:", formData);
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include"
      });

      // Parse the response JSON first to get the error message if any
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Failed to parse response:", error);
        throw new Error("Invalid server response");
      }

      // Then check if the response is ok
      if (!response.ok) {
        console.error("Registration API error:", response.status, data);
        throw new Error(data.message || `API error: ${response.status}`);
      }

      console.log("Registration response:", data);

      if (data.success) {
        console.log("Registration request successful, OTP sent to email");
        
        // IMPORTANT: Don't dispatch registerUser action yet!
        // We'll only do that after OTP verification
        
        toast({ 
          title: "Registration Submitted",
          description: "Please verify your email with the OTP we sent"
        });
        
        // Show OTP input after successful registration
        setShowOtpInput(true);
        startResendCooldown();
      } else {
        // Handle "success: false" from the server
        toast({
          title: "Registration Failed",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your connection and try again",
        variant: "destructive",
      });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      return;
    }

    if (verifyingOtp) return;
    setVerifyingOtp(true);
    
    // Use emailRef to ensure we have the correct email
    const emailToVerify = emailRef.current;
    console.log("Verifying OTP:", otp, "for email:", emailToVerify);

    if (!emailToVerify) {
      toast({
        title: "Verification Error",
        description: "Email address is missing. Please try registering again.",
        variant: "destructive",
      });
      setVerifyingOtp(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: emailToVerify, 
          otp: parseInt(otp, 10) 
        }),
        credentials: "include"
      });

      // Parse the response JSON first
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Failed to parse OTP verification response:", error);
        throw new Error("Invalid server response");
      }

      // Then check if the response is ok
      if (!response.ok) {
        console.error("OTP verification API error:", response.status, data);
        throw new Error(data.message || `API error: ${response.status}`);
      }

      console.log("OTP verification response:", data);

      if (data.success) {
        // NOW is when we actually register the user in our app state
        dispatch(registerUser({
          userName: userNameRef.current,
          email: emailRef.current,
          // Include any other user data from the response if available
          ...(data.user || {})
        }));
        
        toast({ 
          title: "Email Verified",
          description: "Registration complete! You can now log in."
        });
        
        // Redirect to login page after successful verification
        navigate("/auth/login");
      } else {
        toast({
          title: "Verification Failed",
          description: data.message || "Invalid or expired OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      toast({
        title: "Verification Error",
        description: error.message || "Unable to verify OTP. Please try again",
        variant: "destructive",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    
    // Use emailRef to ensure we have the correct email
    const emailToResend = emailRef.current;
    
    if (!emailToResend) {
      toast({
        title: "Error",
        description: "Email address is missing. Please try registering again.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      console.log("Resending OTP for email:", emailToResend);
      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailToResend }),
        credentials: "include"
      });

      // Parse the response JSON first
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Failed to parse resend OTP response:", error);
        throw new Error("Invalid server response");
      }

      // Then check if the response is ok
      if (!response.ok) {
        console.error("Resend OTP API error:", response.status, data);
        throw new Error(data.message || `API error: ${response.status}`);
      }

      console.log("Resend OTP response:", data);

      if (data.success) {
        toast({ 
          title: "OTP Resent",
          description: "A new OTP has been sent to your email"
        });
        startResendCooldown();
      } else {
        toast({
          title: "Failed to Resend OTP",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to resend OTP. Please try again later",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Create new account
          </h1>
          <p className="mt-2">
            Already have an account
            <Link
              className="font-medium ml-2 text-primary hover:underline"
              to="/auth/login"
            >
              Login
            </Link>
          </p>
        </div>
        
        {!showOtpInput ? (
          <CommonForm
            formControls={registerFormControls}
            buttonText={formSubmitting ? "Signing Up..." : "Sign Up"}
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmit}
            disabled={formSubmitting}
            errors={formErrors}
          />
        ) : (
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Email Verification</h2>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              We've sent a 6-digit code to <span className="font-medium">{emailRef.current}</span>
            </p>
            
            <div className="space-y-4">
              <Input
                id="otp-input"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-wider"
                autoComplete="one-time-code"
              />
              
              <div className="flex flex-col space-y-3">
                <Button
                  onClick={handleOtpSubmit}
                  disabled={otp.length !== 6 || verifyingOtp}
                  className="w-full"
                >
                  {verifyingOtp ? "Verifying..." : "Verify OTP"}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="w-full"
                >
                  {resendCooldown > 0 
                    ? `Resend OTP in ${resendCooldown}s` 
                    : "Resend OTP"}
                </Button>
                
                <div className="text-center">
                  <Link
                    className="font-medium text-sm text-primary hover:underline"
                    to="/auth/login"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthRegister;