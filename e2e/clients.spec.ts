import { test, expect } from "@playwright/test"

test.describe("Управление заказчиками", () => {
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
  test("Создание нового заказчика и просмотр карточки", async ({ page }) => {
    await page.goto("/clients")
    await expect(page).toHaveURL("/clients")

    // Нажимаем кнопку добавления заказчика
    await page.getByRole("button", { name: "Добавить заказчика" }).click()

    // Заполняем форму
    const testName = `Тест Клиент ${Date.now()}`
    await page.getByPlaceholder("Например: Екатерина Романова").fill(testName)
    await page.getByPlaceholder("+7 (999) 000-00-00").fill("+7 999 111-22-33")
    await page.getByPlaceholder("Event Bureau / Корпорация").fill("Playwright E2E Agency")
    await page.getByPlaceholder("Особые пожелания").fill("Тестовая заметка для E2E")

    // Сохраняем
    await page.getByRole("button", { name: "Создать заказчика" }).click()

    // Проверяем появление в списке
    await expect(page.getByText(testName)).toBeVisible()

    // Кликаем по заказчику для открытия детального просмотра
    await page.getByText(testName).click()

    // Проверяем карточку детального просмотра
    await expect(page.getByRole("heading", { name: testName })).toBeVisible()
    await expect(page.getByRole("dialog").getByText("Playwright E2E Agency")).toBeVisible()
    await expect(page.getByText("Тестовая заметка для E2E")).toBeVisible()
    await expect(page.getByText("LTV (Выручка)")).toBeVisible()

    // Закрываем модалку
    await page.getByRole("button", { name: "Закрыть" }).click()
  })

  test("Поиск заказчиков фильтрует таблицу", async ({ page }) => {
    await page.goto("/clients")

    const searchInput = page.getByPlaceholder("Поиск по имени, компании, контактам...")
    await searchInput.fill("Кузнецова")

    await expect(page.getByText("Анна Кузнецова")).toBeVisible()
  })
})
