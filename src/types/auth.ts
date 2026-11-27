export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateProfileInput = {
  fullName: string;
  email: string;
};
