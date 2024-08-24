const loginWith = async (page, username, password) => {
  await page.getByTestId('username').fill(username)
  await page.getByTestId('password').fill(password)
  await page.getByRole('button', { name: 'login' }).click()

  await page.waitForTimeout(1000)

  const token = await page.evaluate(() => {
    const loggedUserJSON = localStorage.getItem('loggedBlogappUser')
    return loggedUserJSON ? JSON.parse(loggedUserJSON).token : null
  })

  return token
}

export { loginWith }