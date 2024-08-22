# jsonresume-generator

[![GitHub Super-Linter](https://github.com/Devleaps/jsonresume-generator/actions/workflows/linter.yml/badge.svg)](https://github.com/super-linter/super-linter)
![CI](https://github.com/Devleaps/jsonresume-generator/actions/workflows/ci.yml/badge.svg)

## Description

Generating resumes with JSONResume! Makes use of the `resumed` CLI to generate resumes!

## Features

- :white_check_mark: Supports building multiple resumes at once using a glob pattern
- :white_check_mark: Support for JSON _and_ YAML input files
- :white_check_mark: Support for local and remote themes
- :white_check_mark: Support for PDF and HTML output

## Inputs

<!-- AUTO-DOC-INPUT:START - Do not remove or modify this section -->

```yaml
- uses: Devleaps/jsonresume-generator@v1
  id: jsonresume-generator
  with:
    # Action to perform. Can be
    # either `render` or `validate`.
    # Type: string
    # Default: "render"
    action: ""

    # Name of the resume file.
    # Support for JSON and YAML
    # files.
    # Type: string
    # Default: "resume.json"
    file: ""

    # Name of the folder where
    # the resume file is located.
    # Can also be a wildcard
    # (e.g. resumes/**). The file name is
    # still required and expected to
    # be the same for all
    # files.
    # Type: string
    folder: ""

    # Type of the output file.
    # Can be either PDF or
    # HTML.
    # Type: string
    # Default: "html"
    output-type: ""

    # Where the theme is located.
    # Can be either local or
    # npm. If true, the theme
    # is expected to be in
    # a folder with the theme-name.
    # If false, the theme will
    # be installed through NPM.
    # Type: boolean
    # Default: "false"
    theme-local: ""

    # Name of the theme to
    # use.
    # Type: string
    # Default: "jsonresume-theme-even"
    theme-name: ""
```

<!-- AUTO-DOC-INPUT:END -->

## Usage

Please refer to our [CI workflow](.github/workflows/ci.yml) for multiple examples.

## Contributing

Please take a look at our [contributing guidelines](CONTRIBUTING.md).
