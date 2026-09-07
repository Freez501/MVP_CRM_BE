import { test, expect } from "@playwright/test"

test.describe("Модуль Мероприятия", () => {
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
  test("Канбан-доска отображает колонки со статусами", async ({ page }) => {
    await page.goto("/events")
    await expect(page).toHaveURL("/events")

    // Проверяем наличие колонок
    await expect(page.getByRole("heading", { name: "Новый" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "В работе" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Подтверждён" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Проведён" })).toBeVisible()
    await expect(page.getByRole("heading", { name: "Отменён" })).toBeVisible()
  })

  test("Переключение между Доской и Календарём", async ({ page }) => {
    await page.goto("/events")

    // Переключаемся на Календарь
    await page.getByRole("button", { name: "Календарь" }).click()

    // Проверяем наличие дней недели в календаре
    await expect(page.getByText("Пн", { exact: true })).toBeVisible()
    await expect(page.getByText("Ср", { exact: true })).toBeVisible()
    await expect(page.getByText("Вс", { exact: true })).toBeVisible()

    // Переключаемся обратно на Доску
    await page.getByRole("button", { name: "Доска" }).click()
    await expect(page.getByRole("heading", { name: "Новый" })).toBeVisible()
  })
})
