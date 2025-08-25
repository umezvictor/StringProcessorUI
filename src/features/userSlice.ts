import type { PayloadAction } from "@reduxjs/toolkit";
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { User, UserState } from "../types";
import { APICore } from "../api/apiCore";
import { environmentVariable } from "../config";

const initialState: UserState = {
  value: {
    user: null,
    isLoggedIn: false,
    error: null,
  },
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.value.user = null;
      state.value.isLoggedIn = false;
    },
    clearError: (state) => {
      state.value.error = null;
    },
  },
  extraReducers(builder) {
    builder.addCase(
      loginAsync.fulfilled,
      (
        state,
        action: PayloadAction<{
          succeeded: boolean;
          user: User | null;
          error: string | null;
        }>
      ) => {
        state.value.isLoggedIn = action.payload.succeeded;
        state.value.user = action.payload.user;
        state.value.error = action.payload.error;
      }
    );
  },
});

const api = new APICore();

export const loginAsync = createAsyncThunk(
  "user/loginAsync",
  async (data: any) => {
    const response = await api.postAsync(
      `${environmentVariable.VITE_API_URL}/api/user/login`,
      data
    );
    if (response.data.isSuccess) {
      api.setLoggedInUser(response.data.value);
      return {
        succeeded: response.data.isSuccess,
        user: {
          email: response.data.value.email,
          username: response.data.value.userName,
        },
        error: null,
      };
    } else {
      return {
        succeeded: false,
        user: null,
        error: response.data.description,
      };
    }
  }
);

export const { clearUser, clearError } = userSlice.actions;
export default userSlice.reducer;
