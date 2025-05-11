import { Post, User } from "~/entities/post/types";

export const samplePostInfo: Post = {
  title: "Test Post Title",
  slug: "test-post-title",
  content: "This is the content of the test post.",
  contactInfo: {
    phone: "1234567890",
    email: "test@example.com"
  },
  file: new File(['dummy content'], 'test.jpg', { type: 'image/jpeg' }),
  user: { id: 'user123', name: 'Test User' } as User, // Cast as User
  createdAt: new Date()
};