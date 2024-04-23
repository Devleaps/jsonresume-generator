#!/bin/sh -l

ACTION=$1
FILE_NAME=$2
FOLDER_NAME=$3
THEME_NAME=$4
THEME_LOCAL=$5
OUTPUT_TYPE=$6

cd "$WORK_DIRECTORY" || exit

if echo "$FILE_NAME" | grep -q "\.yaml\|\.yml"; then
    echo "File is YAML"
    FILE_IS_YAML=true
else
    echo "File is not YAML"
    FILE_IS_YAML=false
fi

if [ -z "$FOLDER_NAME" ]; then
    echo "No folder name given, using root"
    ALL_FILES=$(find "${GITHUB_WORKSPACE}" -name "$FILE_NAME")
else
    echo "Folder name given, using $FOLDER_NAME"
    ALL_FILES=$(find "${GITHUB_WORKSPACE}/$FOLDER_NAME" -name "$FILE_NAME")
fi

if [ "$ACTION" = "validate" ]; then
    jq <package.json 'del(.dependencies) | .devDependencies |= {resumed: .resumed}'
    npm install 
elif [ "$ACTION" = "render" ]; then
    # If the theme is not local, then we install the given theme
    # If it is local, we expect it to be here already in a folder with the same name
    # We must add it as a local dependency to the package.json
    if [ "$THEME_LOCAL" = false ]; then
        echo "Theme is not local, installing $THEME_NAME"
        npm install  "$THEME_NAME"
    else
        echo "Theme is local, expecting $THEME_NAME to be in the root"
        THEME_LOCATION="${GITHUB_WORKSPACE}/${THEME_NAME}"
        mv "$THEME_LOCATION" .
        jq --arg themeName "$THEME_NAME" '.dependencies[$themeName] = "file:" + $themeName' package.json >package.json.tmp && mv package.json.tmp package.json
        npm install
    fi
else
    echo "No valid action passed."
    echo "Valid actions are: validate, render"
    echo "Exiting..."
    exit 1
fi

# Loop through all files
# If the extension was .yaml or .yml, use yq to create a JSON file
# If not, do nothing.
# Then, use `npm run render` to create the output file
# If it was YAML before, remove the created JSON file(s)

for file in $ALL_FILES; do
    if [ "$FILE_IS_YAML" = true ]; then
        ACTUAL_FILE_NAME=${file%.*}.json
        yq "$file" -o=json >"$ACTUAL_FILE_NAME"
    else
        ACTUAL_FILE_NAME=${file}
    fi

    HTML_FILE_NAME=${file%.*}.html

    if [ "$ACTION" = "validate" ]; then
        npm run validate -- "$ACTUAL_FILE_NAME"
        # Echo the result of the validation
        if [ $? -eq 1 ]; then
            exit 1
        fi
    else
        npm run render -- "$ACTUAL_FILE_NAME" --output "${HTML_FILE_NAME}" --theme "$THEME_NAME"
        if [ $? -eq 1 ]; then
            exit 1
        fi
    fi

    if [ "$FILE_IS_YAML" = true ]; then
        rm "$ACTUAL_FILE_NAME"
    fi
done

# Exit early if we are only validating
if [ "$ACTION" = "validate" ]; then
    exit 0
fi

# If the output type is PDF, we need to convert the HTML files to PDFs
if [ "$OUTPUT_TYPE" = "pdf" ]; then
    for file in $ALL_FILES; do
        HTML_FILE_NAME=${file%.*}.html
        PDF_FILE_NAME=${file%.*}.pdf
        npm run html-to-pdf -- "$HTML_FILE_NAME" "$PDF_FILE_NAME"
        rm "$HTML_FILE_NAME"
    done
fi
