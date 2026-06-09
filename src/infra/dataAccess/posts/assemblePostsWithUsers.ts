import type { PostData } from "./IPostQueryRepository";
import type { IUserRepository, PostUser } from "../users/IUserRepository";

export interface PostWithUser extends Omit<PostData, "userId"> {
  user: PostUser;
}

export async function assemblePostsWithUsers(
  posts: PostData[],
  userRepo: IUserRepository,
): Promise<PostWithUser[]> {
  if (posts.length === 0) return [];

  const userIds = posts.map((p) => p.userId).filter(Boolean);
  console.log(userIds, "User IDs to fetch for posts");
  const userMap = await userRepo.getUsersByIds(userIds);
  console.log(userMap, "Fetched user map for posts");
  return posts.map((post) => {
    const user = userMap.get(post.userId) ?? {
      id: post.userId,
      email: undefined,
      name: undefined,
      image: undefined,
    };

    return {
      id: post.id,
      price: post.price,
      contactInfo: post.contactInfo,
      translations: post.translations,
      media: post.media,
      createdAt: post.createdAt,
      user,
    };
  });
}
