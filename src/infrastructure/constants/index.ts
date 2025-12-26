export const SIGNIN_PATH = process.env.CJ_AUTH_PATH + "/signin";
export const PAGINATION_INIT_PAGE =
  Number(process.env.NEXT_PUBLIC_PAGINATION_INIT_PAGE) || 1;
export const PAGINATION_PAGE_SIZE =
  Number(process.env.NEXT_PUBLIC_PAGINATION_PAGE_SIZE) || 4;
export const CANONICAL_URL =
  process.env.NEXT_PUBLIC_CANONICAL_URL || "https://hazlosano.com";
export const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://hazlosano.com";
export const POST_CONTENT_MAX_LENGTH =
  process.env.NEXT_POST_CONTENT_MAX_LENGTH || 2500;
export const PUBLIC_BRAND_NAME =
  process.env.NEXT_PUBLIC_BRAND_NAME || "Hazlo Sano";
