import { test, expect } from "@playwright/test"

test.describe("Авторизация и защита маршрутов", () => {
  test("Неавторизованный пользователь перенаправляется на /login", async ({ page }) => {
    await page.goto("/events")
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole("heading", { name: "Brilliant Bar CRM" })).toBeVisible()
    await expect(page.getByRole("button", { name: "Войти в аккаунт" })).toBeVisible()
  })

  test("Быстрый вход через демо-режим администратора", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "Войти как Администратор (Демо)" }).click()

    // После входа пользователь оказывается на главной странице
    await expect(page).toHaveURL("/")
    await expect(page.getByText("Аналитический центр")).toBeVisible()
  })
})
