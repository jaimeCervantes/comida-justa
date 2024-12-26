export type Notification = {
    id: string;
    type: string
    message: string;
    title?: string;
    timeout?: number;
    isOpened: boolean;
}