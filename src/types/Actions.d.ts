export type ActionState = Partial<{
  errors: Partial<{
    errorMessage?: string;
    title: string | null;
    price: string | null;
    phone: string | null;
    content: string | null;
    image: string | null;
    errorMessage: string;
  }>,
  success: boolean;
  id?: string | null;
  slug?: string | null;
}>;
