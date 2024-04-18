export type ActionState = {
  error: boolean;
  messages: Partial<{
    title: string | null;
    price: string | null;
    content: string | null;
    image: string | null;
    errorMessage: string;
  }>;
  id?: string | null;
  slug?: string | null;
};
