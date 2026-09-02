export interface Recipe {
  [ingredient: string]: number
}

export interface SemiProduct {
  name: string
  output_volume: number
  unit: string
  recipe: Recipe
}

export interface Cocktail {
  name: string
  category: string
  recipe: Recipe
  decorations: Recipe
  glassware: Recipe
}

export interface CocktailsDb {
  semi_products: Record<string, SemiProduct>
  cocktails: Record<string, Cocktail>
  categories: Record<string, string>
  bottle_volumes: Record<string, number>
  prices: Record<string, number>
  ingredient_info: Record<string, { display_name?: string; unit: string }>
  category_names: Record<string, string>
  cocktail_categories: string[]
}
