import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  user: null,
  error: null,
};

export const registerUser = createAsyncThunk(
  "/auth/register",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Registration failed" });
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify",
        { email, otp },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Verification failed" });
    }
  }
);

export const loginUser = createAsyncThunk(
  "/auth/login",
  async (formData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Login failed" });
    }
  }
);

export const logoutUser = createAsyncThunk(
  "/auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Logout failed" });
    }
  }
);

export const checkAuth = createAsyncThunk(
  "/auth/checkauth",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/check-auth",
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        return rejectWithValue({ message: "Unauthorized: Please log in" });
      }
      return rejectWithValue(error.response?.data || { message: "Authentication check failed" });
    }
  }
);

export const updateUsername = createAsyncThunk(
  "/auth/updateUsername",
  async (userName, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        "http://localhost:5000/api/auth/profile",
        { userName },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to update username" });
    }
  }
);

export const initiateEmailUpdate = createAsyncThunk(
  "/auth/initiateEmailUpdate",
  async (email, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/profile/request-email-otp",
        { email },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to initiate email update" });
    }
  }
);

export const verifyEmailUpdate = createAsyncThunk(
  "/auth/verifyEmailUpdate",
  async (otp, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/profile/verify-email",
        { otp },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to verify email" });
    }
  }
);

export const resendEmailOtp = createAsyncThunk(
  "/auth/resendEmailOtp",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/profile/resend-email-otp",
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to resend OTP" });
    }
  }
);

export const cancelEmailVerification = createAsyncThunk(
  "/auth/cancelEmailVerification",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/profile/cancel-email-verification",
        {},
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to cancel email verification" });
    }
  }
);

export const changePassword = createAsyncThunk(
  "/auth/changePassword",
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        "http://localhost:5000/api/auth/profile",
        { currentPassword, newPassword },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: "Failed to change password" });
    }
  }
);

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Registration failed";
      })
      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Verification failed";
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.success;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload?.message || "Login failed";
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = action.payload.success;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = action.payload?.message || "Authentication check failed";
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Logout failed";
      })
      // Update Username
      .addCase(updateUsername.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUsername.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && state.user) {
          state.user = { ...state.user, userName: action.payload.user.userName };
          state.error = null;
        }
      })
      .addCase(updateUsername.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to update username";
      })
      // Initiate Email Update
      .addCase(initiateEmailUpdate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initiateEmailUpdate.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && state.user) {
          state.user = { ...state.user, pendingEmail: action.payload.user.pendingEmail };
          state.error = null;
        }
      })
      .addCase(initiateEmailUpdate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to initiate email update";
      })
      // Verify Email Update
      .addCase(verifyEmailUpdate.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmailUpdate.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && state.user) {
          state.user = {
            ...state.user,
            email: action.payload.user.email,
            pendingEmail: null,
            isVerified: action.payload.user.isVerified,
          };
          state.error = null;
        }
      })
      .addCase(verifyEmailUpdate.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to verify email";
      })
      // Resend Email OTP
      .addCase(resendEmailOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendEmailOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendEmailOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to resend OTP";
      })
      // Cancel Email Verification
      .addCase(cancelEmailVerification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(cancelEmailVerification.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.success && state.user) {
          state.user = { ...state.user, pendingEmail: null, isVerified: action.payload.user.isVerified };
          state.error = null;
        }
      })
      .addCase(cancelEmailVerification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to cancel email verification";
      })
      // Change Password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload?.message || "Failed to change password";
      });
  },
});

export const { setUser, clearError } = authSlice.actions;
export default authSlice.reducer;