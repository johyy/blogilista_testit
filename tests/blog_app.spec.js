const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http:localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    })

    await page.goto('http://localhost:5173')
  })

  test('Login form is shown', async ({ page }) => {

    const locator = await page.getByText("log in to application")
    await expect(locator).toBeVisible()
    await expect (page.getByText('username')).toBeVisible()
    await expect (page.getByText('password')).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await page.getByTestId('username').fill('mluukkai')
      await page.getByTestId('password').fill('salainen')
      await page.getByRole('button', { name: 'login' }).click()

      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await page.getByTestId('username').fill('mluukkai')
      await page.getByTestId('password').fill('einiinsalainen')
      await page.getByRole('button', { name: 'login' }).click()

      const errorDiv = await page.locator('.error')
      await expect(errorDiv).toContainText('wrong username or password')
      await expect(errorDiv).toHaveCSS('border-style', 'solid')
      await expect(errorDiv).toHaveCSS('color', 'rgb(255, 0, 0)')
    
      await expect(page.getByText('Matti Luukkainen logged in')).not.toBeVisible()
    })
  })

  describe('When logged in', () => {
    let token

    beforeEach(async ({ page, request }) => {
      token = await loginWith(page, 'mluukkai', 'salainen')
      await request.post('http://localhost:3003/api/blogs', {
        data: {
          title: 'testy test blog',
          author: 'testy author',
          url: 'testy.com'
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      await page.goto('http://localhost:5173')
    })

    test('a new blog can be created', async ({ page, request }) => {
      await request.post('http://localhost:3003/api/blogs', {
        data: {
          title: 'testing creating blog',
          author: 'testing creating author for the blog',
          url: 'testing creating url for the blog'
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      await request.post('http://localhost:3003/api/blogs', {
        data: {
          title: 'First blog',
          author: 'First author',
          url: 'first.com',
          likes: 5
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      await request.post('http://localhost:3003/api/blogs', {
        data: {
          title: 'Second blog',
          author: 'Second author',
          url: 'second.com',
          likes: 10
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      await request.post('http://localhost:3003/api/blogs', {
        data: {
          title: 'Third blog',
          author: 'Third author',
          url: 'third.com',
          likes: 3
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      })


      await page.goto('http://localhost:5173')
      await expect(page.getByText('testing creating blog')).toBeVisible()
    })

    test('a blog can be liked', async ({ page }) => {
      await expect(page.getByText('testy test blog')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByText('likes: 0')).toBeVisible()
      await page.getByRole('button', { name: 'like' }).click()
      await expect(page.getByText('likes: 1')).toBeVisible()
    })

    test('user that added the blog can remove it', async ({ page }) => {
      await expect(page.getByText('testy test blog')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await page.getByRole('button', { name: 'remove' }).click()
      await page.goto('http://localhost:5173')
      await expect(page.getByText('testy test blog')).not.toBeVisible()
    })

    test('only user that created blog can see the remove button', async ({ page, request }) =>{
      await request.post('http://localhost:3003/api/users', {
        data: {
          name: 'Jonna Hyypiä',
          username: 'jonhyypi',
          password: 'salaisin'
        }
      })
      await expect(page.getByText('testy test blog')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByRole('button', { name: 'remove' })).toBeVisible()
      await page.getByRole('button', { name: 'logout' }).click()

      await page.getByTestId('username').fill('jonhyypi')
      await page.getByTestId('password').fill('salaisin')
      await page.getByRole('button', { name: 'login' }).click()
      await expect(page.getByText('testy test blog')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      await expect(page.getByRole('button', { name: 'remove' })).not.toBeVisible()
    })
  })
})