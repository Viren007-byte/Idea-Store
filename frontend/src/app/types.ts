export interface Author {
  _id: string; firstName: string; lastName: string; photoUrl?: string; occupation?: string
}
export interface User extends Author {
  email: string; bio: string; occupation: string; photoUrl: string;
  github: string; linkedin: string; instagram: string; facebook: string;
  role: 'user' | 'admin'; active: boolean; createdAt: string
}
export interface Idea {
  _id: string; title: string; summary: string; content?: string; category: string;
  tags: string[]; visibility: 'private' | 'public'; owner: Author | null;
  createdAt: string; updatedAt: string
}
export interface Comment {
  _id: string; body: string; author: Author | null; createdAt: string
}
export interface IdeaList { ideas: Idea[]; total: number; page: number; pages: number; privateCount?: number; publicCount?: number }
export const categories = ['Technology', 'Education', 'Health', 'Environment', 'Business', 'Design', 'Other'] as const
