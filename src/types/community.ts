import { Timestamp } from "firebase/firestore";

export interface CommunityPost {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likedBy?: string[];
  commentCount?: number;
}

export interface CommunityComment {
  id?: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}
