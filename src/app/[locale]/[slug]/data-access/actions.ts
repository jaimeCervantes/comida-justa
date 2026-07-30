"use server";

import { COMMENTS_PAGE_SIZE } from "~/infra/constants";
import { PostgresCommentRepository } from "~/infra/dataAccess/comments/PostgresCommentRepository";
import type { PostUser } from "~/infra/types/Posts";

const commentRepo = new PostgresCommentRepository();

export async function addCommentToPost(
  postId: string,
  commentContent: string,
  user: PostUser,
) {
  return await commentRepo.addComment(postId, commentContent, user);
}

export async function getMoreComments(
  postId: string,
  page: number = 1,
  pageSize: number = COMMENTS_PAGE_SIZE,
) {
  return await commentRepo.getComments(postId, page, pageSize);
}
