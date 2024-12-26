'use client'
import * as Toast from "@radix-ui/react-toast";
import { useAppSelector } from "~/state/hooks";

export default function Notification() {
  const currentId = useAppSelector((state) => state.notifications.currentId);
  const notification = useAppSelector((state) => state.notifications.items.find((item) => item.id === currentId));
  console.log(notification);
  return (
    <Toast.Provider>
      <Toast.Root open={notification?.isOpened}>
        <Toast.Title>{notification?.title}</Toast.Title>
        <Toast.Description>{notification?.message}</Toast.Description>
        <Toast.Action altText="Cerrar">{notification?.actions}</Toast.Action>
        <Toast.Close />
      </Toast.Root>
      <Toast.Viewport />
    </Toast.Provider>
  )
};
