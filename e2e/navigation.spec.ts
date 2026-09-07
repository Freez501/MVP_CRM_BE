import { test, expect } from "@playwright/test"

test.describe("Навигация по разделам CRM", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "brilliant-demo-user",
        JSON.stringify({
          user: { id: "demo-admin", email: "admin@brilliant-bar.ru" },
          profile: { id: "demo-admin", role: "admin", name: "Администратор" },
        })
      )
    })
  })
  test("Главная страница открывается и отображает аналитический центр", async ({ page }) => {
    await page.goto("/")
    await expect(page).toHaveURL("/")
    await expect(page.getByText("Аналитический центр")).toBeVisible()
    await expect(page.getByText("Выручка (Проведено)")).toBeVisible()
  })

  test("Переход по разделам сайдбара работает корректно", async ({ page }) => {
    await page.goto("/")

    // Мероприятия
    await page.getByRole("link", { name: /Мероприятия/i }).click()
    await expect(page).toHaveURL("/events")
    await expect(page.getByRole("heading", { name: "Воронка мероприятий" })).toBeVisible()

    // Заказчики
    await page.getByRole("link", { name: /Заказчики/i }).click()
    await expect(page).toHaveURL("/clients")
    await expect(page.getByText(/заказчик/i).first()).toBeVisible()

    // Калькулятор
    await page.getByRole("link", { name: /Калькулятор/i }).click()
    await expect(page).toHaveURL("/calculator")
    await expect(page.getByText("Калькулятор и смета закупок")).toBeVisible()

    // База данных
    await page.getByRole("link", { name: /База/i }).click()
    await expect(page).toHaveURL("/database")
  })
})
