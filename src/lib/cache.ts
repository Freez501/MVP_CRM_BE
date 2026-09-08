/**
 * Очистка всех локальных кэшей приложения при смене или выходе пользователя
 */
export function clearAllLocalCaches() {
  const specificKeys = [
    "brilliant_events",
    "brilliant_clients",
    "brilliant_activities",
    "brilliant_company",
    "brilliant-custom-cocktails",
    "brilliant-deleted-cocktails",
    "brilliant-custom-semi-products",
    "brilliant-deleted-semi-products",
    "brilliant-custom-prices",
    "brilliant-deleted-ingredients",
    "brilliant-custom-categories-map",
    "brilliant-custom-ingredient-info",
    "brilliant-custom-bottle-volumes",
    "brilliant-custom-category-names",
    "brilliant-deleted-categories",
    "brilliant-team-invites",
    "brilliant-calculator-selected",
  ]

  specificKeys.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  })

  // Очистка динамических ключей компаний и профилей
  try {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (
        key &&
        (key.startsWith("brilliant_company_") ||
          key.startsWith("brilliant_profile_"))
      ) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  } catch {
    // ignore
  }
}
