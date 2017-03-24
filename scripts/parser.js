import path from 'path'
import { exec } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { listDirRecursive } from './utils'

const jsDocRegExp = /[^\S\r\n]*\/(?:\*{2})([\W\w]+?)\*\/([\W\w]+?)?(?=\s+\/\*{1,2}|$)/g
const jsVarsRegExp = /\@(\w+)\s+([^\@]+)/g
const starsRegExp = /^\s?\*\s?/gm
const newLineRegExp = /\n/g

const UIKIT_IDENTIFIER = 'uikit'
const TEMPLATE_REGEXP = /\[\s?]\s?\/\/\s?\{\{\s?categories\s?}}/g

export const buildUiKitAST= (srcPath, destPath, extensions) => {
  let ast = {
    categories: []
  }

  let categories = {}

  const getVariable = (arr, name) => {
    const val = arr.filter((variable) => variable.name === name)
    return val.length > 0 ? val[val.length - 1].value : undefined
  }

  const fileList = listDirRecursive(srcPath, extensions)

  fileList.map((filePath, index) => {
    const fileAST = parseFile(filePath)

    fileAST.map((jsDocNode) => {
      const jsDocVariables = jsDocNode.variables
      const code = jsDocNode.code || ''

      if(getVariable(jsDocVariables, UIKIT_IDENTIFIER)) {
        const name = getVariable(jsDocVariables, UIKIT_IDENTIFIER)
        // const importName = getVariable(jsDocVariables, 'import')
        // const importPath = '.' + path.sep + path.join(destPath.split(path.sep).pop(), filePath.replace(srcPath, ''))
        const description = getVariable(jsDocVariables, 'description')
        const category = getVariable(jsDocVariables, 'category') || 'default'
        const params = getVariable(jsDocVariables, 'param')
        const examples = getVariable(jsDocVariables, 'example')

        // if(!importName) throw new Error(`Missing @import on '${name}' component.\nFile: ${importPath}`)
        if(!categories[category]) categories[category] = []

        categories[category].push({
          name,
          path: filePath.replace(process.cwd(), ""),
          // importName,
          // importPath,
          // params,
          // examples,
          // description,
          variables: jsDocVariables,
          code,
        })
      }
    })
  })

  Object.keys(categories).map((name) => {
    ast.categories.push({
      name,
      components: categories[name]
    })
  })

  return ast
}

/**
 * Parses the JsDocs of a file
 *
 * @param fileName
 * @returns {Object}
 */
export const parseFile = (fileName) => parse(readFileSync(fileName))

/**
 * Parses the given contents and builds an AST of shape:
 *
 * [
 *   {
 *     variables: [
 *       {
 *         name: String,
 *         value: String
 *       },
 *       ...
 *     ],
 *     code: String
 *   },
 *   ...
 * ]
 *
 *
 * @param contents
 * @returns {Object}
 */
export const parse = (contents) => {
  let docMatch
  let ast = []
  
  while(docMatch = jsDocRegExp.exec(contents)) {
    const jsDoc = docMatch[1]
    const code = docMatch[2].replace(/^\n+|\n+$/gm,'');
    let varsMatch
    
    ast.push({
      variables: [],
      code,
    })
    
    while(varsMatch = jsVarsRegExp.exec(jsDoc)) {
      const name = varsMatch[1]
      const value = varsMatch[2].replace(starsRegExp, '').replace(newLineRegExp, ' ').trim()
      
      ast[ast.length - 1].variables.push({
        name,
        value,
      })
    }
  }
  
  return ast
}
