import * as core from '@actions/core'
import { execSync } from 'child_process'
import { glob } from 'glob'
import * as fs from 'fs'
import * as yaml from 'js-yaml'
import puppeteer from 'puppeteer'
import * as path from 'path'

interface ActionInputs {
  action: 'validate' | 'render'
  file: string
  folder: string | undefined
  themeName: string
  themeLocal: boolean
  outputType: 'html' | 'pdf'
}

async function getInputs(): Promise<ActionInputs> {
  // When running locally, use process.env
  if (process.env['INPUT_ACTION']) {
    return {
      action: process.env['INPUT_ACTION'] as 'validate' | 'render',
      file: process.env['INPUT_FILE'] || '',
      folder: process.env['INPUT_FOLDER'],
      themeName: process.env['INPUT_THEME_NAME'] || '',
      themeLocal: process.env['INPUT_THEME_LOCAL'] === 'true',
      outputType: (process.env['INPUT_OUTPUT_TYPE'] || '').toLowerCase() as
        | 'html'
        | 'pdf'
    }
  }
  // When running as a GitHub Action, use core.getInput
  return {
    action: core.getInput('action') as 'validate' | 'render',
    file: core.getInput('file'),
    folder: core.getInput('folder') || undefined,
    themeName: core.getInput('theme-name'),
    themeLocal: core.getInput('theme-local') === 'true',
    outputType: core.getInput('output-type').toLowerCase() as 'html' | 'pdf'
  }
}

async function findResumeFiles(
  fileName: string,
  folderName?: string
): Promise<string[]> {
  const pattern = folderName ? `${folderName}/**/${fileName}` : `**/${fileName}`
  const files = glob.sync(pattern, { 
    ignore: ['node_modules/**', 'coverage/**', 'dist/**'],
    nodir: true
  })
  return files
}

async function convertYamlToJson(yamlFile: string): Promise<string> {
  const content = fs.readFileSync(yamlFile, 'utf8')
  const jsonContent = yaml.load(content)
  const jsonFile = yamlFile.replace(/\.ya?ml$/, '.json')
  fs.writeFileSync(jsonFile, JSON.stringify(jsonContent, null, 2))
  return jsonFile
}

async function installTheme(
  themeName: string,
  isLocal: boolean
): Promise<void> {
  if (isLocal) {
    const themePath = path.resolve(process.cwd(), themeName)
    const packageJsonPath = path.join(themePath, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    core.info(`Using local theme: ${themePath} (package: ${packageJson.name})`)
    execSync(
      `cd "${themePath}" && npm install && cd "${process.cwd()}" && npm install "${themePath}"`,
      { stdio: 'inherit' }
    )
  } else {
    core.info(`Installing theme from npm: ${themeName}`)
    execSync(`npm install ${themeName}`, { stdio: 'inherit' })
  }
}

async function validateResume(jsonFile: string): Promise<boolean> {
  try {
    execSync(`npx resumed validate ${jsonFile}`, { stdio: 'inherit' })
    core.info(`✅ Resume ${jsonFile} is valid`)
    return true
  } catch (error) {
    core.error(`❌ Resume ${jsonFile} is invalid`)
    throw error
  }
}

async function renderResume(
  jsonFile: string,
  themeName: string,
  isLocal: boolean
): Promise<string> {
  const htmlFile = jsonFile.replace(/\.json$/, '.html')
  const packageName = isLocal ? `jsonresume-theme-${themeName}` : themeName
  execSync(
    `npx resumed render ${jsonFile} --theme ${packageName} --output ${htmlFile}`,
    {
      stdio: 'inherit'
    }
  )
  return htmlFile
}

async function convertToPdf(htmlFile: string): Promise<string> {
  const pdfFile = htmlFile.replace(/\.html$/, '.pdf')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  })

  const page = await browser.newPage()
  const html = fs.readFileSync(htmlFile, 'utf8')
  await page.setContent(html)
  await page.pdf({ path: pdfFile, format: 'A4' })
  await browser.close()

  // Remove HTML file if we're generating PDF
  fs.unlinkSync(htmlFile)

  return pdfFile
}

export async function run(): Promise<void> {
  try {
    // Get inputs
    const inputs = await getInputs()

    // Install dependencies first
    core.info('Installing dependencies...')
    execSync('npm install resumed puppeteer', { stdio: 'inherit' })

    // Find all resume files
    const files = await findResumeFiles(inputs.file, inputs.folder)
    if (files.length === 0) {
      throw new Error(`No resume files found matching ${inputs.file}`)
    }

    // Install theme after dependencies only if rendering
    if (inputs.action === 'render') {
      await installTheme(inputs.themeName, inputs.themeLocal)
    }

    // Process each file
    for (const file of files) {
      core.info(`Processing ${file}...`)

      // Convert YAML to JSON if needed
      const isYaml = /\.ya?ml$/.test(file)
      const jsonFile = isYaml ? await convertYamlToJson(file) : file

      if (inputs.action === 'validate') {
        await validateResume(jsonFile)
      } else {
        const htmlFile = await renderResume(
          jsonFile,
          inputs.themeName,
          inputs.themeLocal
        )
        if (inputs.outputType === 'pdf') {
          const pdfFile = await convertToPdf(htmlFile)
          core.info(`Generated PDF: ${pdfFile}`)
        } else {
          core.info(`Generated HTML: ${htmlFile}`)
        }
      }

      // Clean up temporary JSON file if we converted from YAML
      if (isYaml) {
        fs.unlinkSync(jsonFile)
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    } else {
      core.setFailed('An unknown error occurred')
    }
  }
}

// Run the action if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  void run()
}
