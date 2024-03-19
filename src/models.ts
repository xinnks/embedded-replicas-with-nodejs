export interface Recipe {
  id: string;
  name: string;
  nutritionInformation?: string;
  instructions?: string;
  createdAt: number;
  updatedAt: number;
  ingredients?: Ingredient[];
}

export interface Ingredient {
  id: string;
  name: string;
  measurements: string;
  recipeid?: string;
  createdAt: string;
  updatedAt: string;
}
