export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface CreateCategoryInput {
  name: string;
}

export type UpdateCategoryInput = CreateCategoryInput;
