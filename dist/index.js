'use strict';

var core = require('@actions/core');
var child_process = require('child_process');
var glob = require('glob');
var fs = require('fs');
var yaml = require('js-yaml');
var puppeteer = require('puppeteer');
var path = require('path');

var _documentCurrentScript = typeof document !== 'undefined' ? document.currentScript : null;
function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () { return e[k]; }
                });
            }
        });
    }
    n.default = e;
    return Object.freeze(n);
}

var core__namespace = /*#__PURE__*/_interopNamespaceDefault(core);
var fs__namespace = /*#__PURE__*/_interopNamespaceDefault(fs);
var yaml__namespace = /*#__PURE__*/_interopNamespaceDefault(yaml);
var path__namespace = /*#__PURE__*/_interopNamespaceDefault(path);

async function getInputs() {
    // When running locally, use process.env
    if (process.env['INPUT_ACTION']) {
        return {
            action: process.env['INPUT_ACTION'],
            file: process.env['INPUT_FILE'] || '',
            folder: process.env['INPUT_FOLDER'],
            themeName: process.env['INPUT_THEME_NAME'] || '',
            themeLocal: process.env['INPUT_THEME_LOCAL'] === 'true',
            outputType: (process.env['INPUT_OUTPUT_TYPE'] || '').toLowerCase()
        };
    }
    // When running as a GitHub Action, use core.getInput
    return {
        action: core__namespace.getInput('action'),
        file: core__namespace.getInput('file'),
        folder: core__namespace.getInput('folder') || undefined,
        themeName: core__namespace.getInput('theme-name'),
        themeLocal: core__namespace.getInput('theme-local') === 'true',
        outputType: core__namespace.getInput('output-type').toLowerCase()
    };
}
async function findResumeFiles(fileName, folderName) {
    const pattern = folderName ? `${folderName}/**/${fileName}` : `**/${fileName}`;
    return glob.glob.sync(pattern, { ignore: 'node_modules/**' });
}
async function convertYamlToJson(yamlFile) {
    const content = fs__namespace.readFileSync(yamlFile, 'utf8');
    const jsonContent = yaml__namespace.load(content);
    const jsonFile = yamlFile.replace(/\.ya?ml$/, '.json');
    fs__namespace.writeFileSync(jsonFile, JSON.stringify(jsonContent, null, 2));
    return jsonFile;
}
async function installTheme(themeName, isLocal) {
    if (isLocal) {
        const themePath = path__namespace.resolve(process.cwd(), themeName);
        const packageJsonPath = path__namespace.join(themePath, 'package.json');
        const packageJson = JSON.parse(fs__namespace.readFileSync(packageJsonPath, 'utf8'));
        core__namespace.info(`Using local theme: ${themePath} (package: ${packageJson.name})`);
        child_process.execSync(`cd "${themePath}" && npm install && cd "${process.cwd()}" && npm install "${themePath}"`, { stdio: 'inherit' });
    }
    else {
        core__namespace.info(`Installing theme from npm: ${themeName}`);
        child_process.execSync(`npm install ${themeName}`, { stdio: 'inherit' });
    }
}
async function validateResume(jsonFile) {
    try {
        child_process.execSync(`npx resumed validate ${jsonFile}`, { stdio: 'inherit' });
        core__namespace.info(`✅ Resume ${jsonFile} is valid`);
        return true;
    }
    catch (error) {
        core__namespace.error(`❌ Resume ${jsonFile} is invalid`);
        throw error;
    }
}
async function renderResume(jsonFile, themeName, isLocal) {
    const htmlFile = jsonFile.replace(/\.json$/, '.html');
    const packageName = isLocal ? `jsonresume-theme-${themeName}` : themeName;
    child_process.execSync(`npx resumed render ${jsonFile} --theme ${packageName} --output ${htmlFile}`, {
        stdio: 'inherit'
    });
    return htmlFile;
}
async function convertToPdf(htmlFile) {
    const pdfFile = htmlFile.replace(/\.html$/, '.pdf');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    const html = fs__namespace.readFileSync(htmlFile, 'utf8');
    await page.setContent(html);
    await page.pdf({ path: pdfFile, format: 'A4' });
    await browser.close();
    // Remove HTML file if we're generating PDF
    fs__namespace.unlinkSync(htmlFile);
    return pdfFile;
}
async function run() {
    try {
        // Get inputs
        const inputs = await getInputs();
        // Install dependencies first
        core__namespace.info('Installing dependencies...');
        child_process.execSync('npm install resumed puppeteer', { stdio: 'inherit' });
        // Find all resume files
        const files = await findResumeFiles(inputs.file, inputs.folder);
        if (files.length === 0) {
            throw new Error(`No resume files found matching ${inputs.file}`);
        }
        // Install theme after dependencies
        await installTheme(inputs.themeName, inputs.themeLocal);
        // Process each file
        for (const file of files) {
            core__namespace.info(`Processing ${file}...`);
            // Convert YAML to JSON if needed
            const isYaml = /\.ya?ml$/.test(file);
            const jsonFile = isYaml ? await convertYamlToJson(file) : file;
            if (inputs.action === 'validate') {
                await validateResume(jsonFile);
            }
            else {
                const htmlFile = await renderResume(jsonFile, inputs.themeName, inputs.themeLocal);
                if (inputs.outputType === 'pdf') {
                    const pdfFile = await convertToPdf(htmlFile);
                    core__namespace.info(`Generated PDF: ${pdfFile}`);
                }
                else {
                    core__namespace.info(`Generated HTML: ${htmlFile}`);
                }
            }
            // Clean up temporary JSON file if we converted from YAML
            if (isYaml) {
                fs__namespace.unlinkSync(jsonFile);
            }
        }
    }
    catch (error) {
        if (error instanceof Error) {
            core__namespace.setFailed(error.message);
        }
        else {
            core__namespace.setFailed('An unknown error occurred');
        }
    }
}
// Run the action if this is the main module
if ((typeof document === 'undefined' ? require('u' + 'rl').pathToFileURL(__filename).href : (_documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === 'SCRIPT' && _documentCurrentScript.src || new URL('index.js', document.baseURI).href)) === `file://${process.argv[1]}`) {
    void run();
}

exports.run = run;
//# sourceMappingURL=index.js.map
