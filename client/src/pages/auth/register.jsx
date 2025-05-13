import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { registerUser } from "@/store/auth-slice";
import { registerFormControls } from "@/config";
import CommonForm from "@/components/common/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const initialState = {
  userName: "",
  email: "",
  password: "",
};

const AuthRegister = () => {
  const emailRef = useRef("");
  const userNameRef = useRef("");
  
  const [formData, setFormData] = useState(initialState);
  const [otp, setOtp] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

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
    } else if (!/^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/.test(formData.password)) {
      errors.password = "Password must contain at least one capital letter, one number, and only letters/numbers";
    }
    
    setFormErrors(errors);

    const allFieldsEmpty = !formData.userName.trim() && !formData.email.trim() && !formData.password;
    
    if (allFieldsEmpty) {
      toast({
        title: "Validation Error",
        description: "Please fill the form to signup",
        variant: "destructive",
      });
      return false;
    }

    if (Object.keys(errors).length > 0) {
      Object.values(errors).forEach((error) => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });
    }
    
    return Object.keys(errors).length === 0;
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (formSubmitting) return;
    setFormSubmitting(true);

    emailRef.current = formData.email;
    userNameRef.current = formData.userName;

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      if (data.success) {
        toast({ 
          title: "Registration Submitted",
          description: "Please verify your email with the OTP we sent"
        });
        
        setShowOtpInput(true);
        startResendCooldown();
      } else {
        throw new Error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.message.includes("Failed to send OTP email")
        ? "Unable to send verification email. Please check your email address or try again later."
        : error.message.includes("Failed to save user")
        ? "Unable to create account due to database issue. Please check your connection and try again later."
        : error.message.includes("Email already in use")
        ? "The email is already in use. Please use a different email or log in."
        : error.message.includes("Username already in use")
        ? "The username is already in use. Please choose a different username."
        : error.message || "An unexpected error occurred. Please try again later.";
      toast({
        title: "Registration Error",
        description: errorMessage,
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
    
    const emailToVerify = emailRef.current;

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "OTP verification failed");
      }

      if (data.success) {
        dispatch(registerUser({
          userName: userNameRef.current,
          email: emailRef.current,
          ...(data.user || {})
        }));
        
        toast({ 
          title: "Email Verified",
          description: "Registration complete! You can now log in."
        });
        
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
        description: error.message || "Unable to verify OTP. Please try again.",
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
      const response = await fetch(`${API_URL}/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: emailToResend }),
        credentials: "include"
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

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
            formControls={registerFormControls.map(control => {
              if (control.name === "password") {
                return {
                  ...control,
                  componentType: "custom",
                  customRender: ({ field }) => (
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={control.placeholder}
                        {...field}
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  )
                };
              }
              return control;
            })}
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