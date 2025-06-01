import { createSlice } from '@reduxjs/toolkit';
import axiosClient from '../util/axiosClient';

var user = null

try {
  const resp = await axiosClient.get('/auth/validate');
  user = resp.data;
} catch (e) {
  user = null;
}

const initialState = {
  user,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login(state, action) {
      state.user = action.payload;
    },
    logout(state) {
      state.user = null;
    },
  },
});

export const { login, logout } = userSlice.actions;
export default userSlice.reducer;
