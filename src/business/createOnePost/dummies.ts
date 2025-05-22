import { Post, User } from "~/business/entities/post/types";

export const samplePostInfo: Post = {
  title: "Test Post Title",
  slug: "test-post-title",
  content: "This is the content of the test post.",
  contactInfo: {
    phone: "1234567890",
    email: "test@example.com"
  },
  media: {
    url: "http://saludjusta.com/files/test.jpg",
    type: 'image',
    alt: 'Test Post Title'
  },
  user: { id: 'user123', name: 'Test User' } as User, // Cast as User
  createdAt: new Date()
};