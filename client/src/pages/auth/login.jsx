import { useState } from "react";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { loginUser } from "@/store/auth-slice";
import { loginFormControls } from "@/config";
import CommonForm from "@/components/common/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

const initialState = {
  email: "",
  password: "",
};

const forgotPasswordState = {
  email: "",
};

const resetPasswordState = {
  email: "",
  otp: "",
  newPassword: "",
};

function AuthLogin() {
  const [formData, setFormData] = useState(initialState);
  const [forgotPasswordData, setForgotPasswordData] = useState(forgotPasswordState);
  const [resetPasswordData, setResetPasswordData] = useState(resetPasswordState);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const dispatch = useDispatch();
  const { toast } = useToast();
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const onSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    dispatch(loginUser(formData)).then((data) => {
      setIsSubmitting(false);
      if (data?.payload?.success) {
        toast({
          title: data?.payload?.message,
        });
        const role = data.payload.user?.role;
        if (role === "admin") {
          navigate("/admin/new-dashboard");
        } else {
          navigate("/shop/home");
        }
      } else {
        toast({
          title: data?.payload?.message,
          variant: "destructive",
        });
      }
    });
  };

  const handleForgotPasswordSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: forgotPasswordData.email }),
        credentials: "include"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset OTP");
      }

      if (data.success) {
        toast({
          title: "Reset OTP Sent",
          description: "Please check your email for the OTP to reset your password"
        });
        setResetPasswordData({ ...resetPasswordData, email: forgotPasswordData.email });
        setShowForgotPassword(false);
        setShowResetPassword(true);
        startResendCooldown();
      } else {
        toast({
          title: "Failed to Send OTP",
          description: data.message || "Please try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to send reset OTP",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (resetPasswordData.otp.length !== 6 || !/^\d+$/.test(resetPasswordData.otp)) {
      toast({
        title: "Invalid OTP",
        description: "Please enter a valid 6-digit OTP",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Updated password regex to match server-side requirement
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])[A-Za-z0-9]+$/;
    if (!passwordRegex.test(resetPasswordData.newPassword)) {
      toast({
        title: "Invalid Password",
        description: "Password must contain at least one capital letter, one number, and only letters/numbers",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: resetPasswordData.email,
          otp: parseInt(resetPasswordData.otp, 10),
          newPassword: resetPasswordData.newPassword
        }),
        credentials: "include"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      if (data.success) {
        toast({
          title: "Password Reset Successful",
          description: "You can now log in with your new password"
        });
        setShowResetPassword(false);
        setForgotPasswordData(forgotPasswordState);
        setResetPasswordData(resetPasswordState);
      } else {
        toast({
          title: "Password Reset Failed",
          description: data.message || "Invalid or expired OTP",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to reset password",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  const handleResendResetOtp = async () => {
    if (resendCooldown > 0) return;
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: resetPasswordData.email }),
        credentials: "include"
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to resend reset OTP");
      }

      if (data.success) {
        toast({
          title: "Reset OTP Resent",
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
      console.error("Resend reset OTP error:", error);
      toast({
        title: "Error",
        description: error.message || "Unable to resend reset OTP",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md spaceastate space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Sign in to your account
        </h1>
        <p className="mt-2">
          Don't have an account
          <Link
            className="font-medium ml-2 text-primary hover:underline"
            to="/auth/register"
          >
            Register
          </Link>
        </p>
      </div>

      {!showForgotPassword && !showResetPassword && (
        <>
          <CommonForm
            formControls={loginFormControls.map(control => {
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
            buttonText={isSubmitting ? "Signing In..." : "Sign In"}
            formData={formData}
            setFormData={setFormData}
            onSubmit={onSubmit}
            disabled={isSubmitting}
          />
          <div className="text-center">
            <button
              className="text-sm text-primary hover:underline"
              onClick={() => setShowForgotPassword(true)}
            >
              Forgot Password?
            </button>
          </div>
        </>
      )}

      {showForgotPassword && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email"
              value={forgotPasswordData.email}
              onChange={(e) => setForgotPasswordData({ ...forgotPasswordData, email: e.target.value })}
              required
            />
            <div className="flex flex-col space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "Sending OTP..." : "Send Reset OTP"}
              </Button>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      )}

      {showResetPassword && (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
          <p className="text-sm text-muted-foreground mb-4">
            We've sent a 6-digit code to <span className="font-medium">{resetPasswordData.email}</span>
          </p>
          <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
            <Input
              placeholder="Enter 6-digit OTP"
              value={resetPasswordData.otp}
              onChange={(e) => setResetPasswordData({ ...resetPasswordData, otp: e.target.value.replace(/[^0-9]/g, '').slice(0, 6) })}
              maxLength={6}
              className="text-center text-lg tracking-wider"
              required
            />
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={resetPasswordData.newPassword}
                onChange={(e) => setResetPasswordData({ ...resetPasswordData, newPassword: e.target.value })}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <div className="flex flex-col space-y-3">
              <Button
                type="submit"
                disabled={isSubmitting || resetPasswordData.otp.length !== 6}
                className="w-full"
              >
                {isSubmitting ? "Resetting..." : "Reset Password"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendResetOtp}
                disabled={resendCooldown > 0 || isSubmitting}
                className="w-full"
              >
                {resendCooldown > 0 
                  ? `Resend OTP in ${resendCooldown}s` 
                  : "Resend OTP"}
              </Button>
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => {
                  setShowResetPassword(false);
                  setShowForgotPassword(false);
                }}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AuthLogin;