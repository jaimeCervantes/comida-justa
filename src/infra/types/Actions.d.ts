export type ActionState = Partial<{
  errors: Partial<{
    errorMessage?: string;
    title: string | null;
    price: string | null;
    phone: string | null;
    content: string | null;
    image: string | null;
    /** Solo un evento las usa; en lo demás llegan siempre `null`. */
    startsAt: string | null;
    endsAt: string | null;
    route: string | null;
    errorMessage: string;
  }>;
  success: boolean;
  id?: string | null;
  slug?: string | null;
}>;
