// Used to convert a given HTML file to a PDF file

import * as fs from 'fs'
import puppeteer from 'puppeteer'

const htmlFile = process.argv[2]
const pdfFile = process.argv[3];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/usr/bin/chromium-browser',
    args: [
      '--no-sandbox',
      '--headless',
      '--disable-gpu',
      '--disable-dev-shm-usage'
    ]
  })
  const page = await browser.newPage()
  const html = fs.readFileSync(htmlFile, 'utf8')
  await page.setContent(html)
  await page.pdf({ path: pdfFile, format: 'A4' })

  await browser.close()
})()
