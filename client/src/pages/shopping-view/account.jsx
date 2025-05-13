'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDispatch, useSelector } from 'react-redux';
import { useToast } from '@/components/ui/use-toast';
import { updateUsername, initiateEmailUpdate, verifyEmailUpdate, resendEmailOtp, cancelEmailVerification, changePassword } from '@/store/auth-slice';
import { Loader2, Mail, Lock, User, CheckCircle, XCircle, Edit2 } from 'lucide-react';

function ShoppingAccount() {
  const { user, isLoading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    username: user?.userName || '',
    email: user?.email || '',
    newEmail: '',
    currentPassword: '',
    newPassword: '',
    otp: '',
  });
  const [pendingEmail, setPendingEmail] = useState(user?.pendingEmail || null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEmailVerificationMode, setIsEmailVerificationMode] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);

  useEffect(() => {
    setPendingEmail(user?.pendingEmail || null);
    setFormData((prev) => ({
      ...prev,
      username: user?.userName || '',
      email: user?.email || '',
    }));
    setIsEmailVerificationMode(!!user?.pendingEmail);
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="text-lg font-semibold mb-2">Please Log In</h3>
        <p className="text-muted-foreground">You need to log in to view your account settings.</p>
      </div>
    );
  }

  const handleUpdateUsername = async () => {
    if (!formData.username) {
      toast({ title: 'Please enter a username', variant: 'destructive' });
      return;
    }

    try {
      const result = await dispatch(updateUsername(formData.username)).unwrap();
      if (result.success) {
        setIsEditingUsername(false);
        toast({ title: 'Username updated successfully', className: 'bg-green-500 text-white' });
      } else {
        toast({ title: result.message || 'Failed to update username', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error updating username', description: error.message, variant: 'destructive' });
    }
  };

  const handleInitiateEmailUpdate = async () => {
    if (!formData.newEmail) {
      toast({ title: 'Please enter a new email address', variant: 'destructive' });
      return;
    }

    try {
      const result = await dispatch(initiateEmailUpdate(formData.newEmail)).unwrap();
      if (result.success) {
        setPendingEmail(result.user.pendingEmail);
        setIsEmailVerificationMode(true);
        toast({ title: 'OTP sent to your new email' });
      } else {
        toast({ title: result.message || 'Failed to initiate email update', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error initiating email update', description: error.message, variant: 'destructive' });
    }
  };

  const handleVerifyEmail = async () => {
    if (!formData.otp) {
      toast({ title: 'Please enter the OTP', variant: 'destructive' });
      return;
    }

    setIsVerifying(true);
    try {
      const result = await dispatch(verifyEmailUpdate(formData.otp)).unwrap();
      if (result.success) {
        setPendingEmail(null);
        setIsEmailVerificationMode(false);
        setFormData((prev) => ({ ...prev, email: result.user.email, newEmail: '', otp: '' }));
        toast({ title: result.message, className: 'bg-green-500 text-white' });
      } else {
        toast({ title: result.message || 'Failed to verify email', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error verifying email', description: error.message, variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const result = await dispatch(resendEmailOtp()).unwrap();
      if (result.success) {
        toast({ title: result.message, className: 'bg-green-500 text-white' });
      } else {
        toast({ title: result.message || 'Failed to resend OTP', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error resending OTP', description: error.message, variant: 'destructive' });
    }
  };

  const handleChangePassword = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      toast({ title: 'Please provide both passwords', variant: 'destructive' });
      return;
    }

    try {
      const result = await dispatch(changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })).unwrap();
      if (result.success) {
        toast({ title: 'Password updated successfully', className: 'bg-green-500 text-white' });
        setFormData((prev) => ({ ...prev, currentPassword: '', newPassword: '' }));
      } else {
        toast({ title: result.message || 'Failed to update password', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error updating password', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancelEmailVerification = async () => {
    setIsEmailVerificationMode(false);
    setFormData((prev) => ({ ...prev, newEmail: '', otp: '' }));
    setPendingEmail(null);

    try {
      const result = await dispatch(cancelEmailVerification()).unwrap();
      if (result.success) {
        toast({ title: 'Email verification cancelled', className: 'bg-green-500 text-white' });
      } else {
        toast({ title: result.message || 'Failed to cancel verification', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error cancelling verification', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <User className="h-6 w-6 text-blue-600" />
            Account Settings
          </h1>
        </div>
      </div>

      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isEmailVerificationMode ? (
            <div className="p-6 space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                  Verify Your Email
                </h3>
                <p className="text-gray-600 mt-2">
                  An OTP has been sent to <span className="font-medium text-gray-800">{pendingEmail}</span>.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter 6-digit OTP"
                    value={formData.otp}
                    onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleVerifyEmail}
                    disabled={isVerifying || isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isVerifying ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Verify Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelEmailVerification}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
                <div className="text-center">
                  <Button
                    variant="link"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Didn't receive code? Resend OTP
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Personal Details Section */}
              <div className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3 mb-4">
                    <User className="h-5 w-5 text-blue-600" />
                    Personal Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                          disabled={!isEditingUsername}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (isEditingUsername) handleUpdateUsername();
                            else setIsEditingUsername(true);
                          }}
                          disabled={isLoading}
                          className="w-24"
                        >
                          {isEditingUsername ? (
                            isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <Edit2 className="h-4 w-4 mr-2" />
                          )}
                          {isEditingUsername ? 'Save' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </Label>
                      <Input 
                        value={formData.email} 
                        disabled 
                        className="bg-gray-50 text-gray-600" 
                      />
                    </div>
                  </div>
                </div>

                {/* Email Update Section */}
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3 mb-4">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Update Email Address
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        New Email Address
                      </Label>
                      <Input
                        id="newEmail"
                        type="email"
                        placeholder="Enter your new email"
                        value={formData.newEmail}
                        onChange={(e) => setFormData({ ...formData, newEmail: e.target.value })}
                      />
                    </div>
                    <Button
                      onClick={handleInitiateEmailUpdate}
                      disabled={isLoading || !formData.newEmail}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Mail className="h-4 w-4 mr-2" />}
                      Update Email
                    </Button>
                  </div>
                </div>
              </div>

              {/* Password Update Section */}
              <div className="p-6 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-3 mb-4">
                  <Lock className="h-5 w-5 text-blue-600" />
                  Change Password
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      placeholder="Enter your current password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="Enter your new password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                  <Button
                    onClick={handleChangePassword}
                    disabled={isLoading || !formData.currentPassword || !formData.newPassword}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                    Change Password
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShoppingAccount;