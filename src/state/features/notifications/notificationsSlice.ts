import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Notification } from '~/types/Notifications';

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState: { items: [] as Notification[], delay: 3000, currentId: "" },
  reducers: {
    toggle: (state, action: PayloadAction<string>) => {
      const notification = state.items.find((item) => item.id === action.payload)
      if (notification) {
        notification.isOpened = !notification.isOpened;
        state.currentId = notification.id;
      }
    }
  },
});

export default notificationsSlice.reducer;
export const { toggle } = notificationsSlice.actions;
