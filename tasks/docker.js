const path = require('path')
const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const readFile = require('util').promisify(require('fs').readFile)
const exists = require('file-exists')

module.exports = function (angel) {
  angel.on('docker', (angel) => {
    angel.do('docker production')
  })
  angel.on('docker :mode', (angel) => {
    angel.do(`docker ${angel.cmdData.mode} -- npm run start`)
  })
  angel.on(/docker (.*) (.*) -- (.*)/, async function (angel) {
    let baseImageTag = angel.cmdData[1]
    let mode = angel.cmdData[2]
    let runCmd = angel.cmdData[3]

    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let fullRepoPath = await findSkeletonRoot()
    const loadCellInfo = require(path.join(fullRepoPath, 'cells/node_modules/lib/load-cell-info'))
    let cellInfo = await loadCellInfo(packagejson.name)
    console.log(`FROM ${baseImageTag}

    COPY . .
            
    WORKDIR ${cellInfo.dna.cwd}
    ENV NODE_ENV ${mode}
    CMD ${runCmd}`)
  })
  angel.on(/docker (.*) -- (.*)/, async function (angel) {
    let mode = angel.cmdData[1]
    let runCmd = angel.cmdData[2]
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let fullRepoPath = await findSkeletonRoot()
    const loadCellInfo = require(path.join(fullRepoPath, 'cells/node_modules/lib/load-cell-info'))
    let cellInfo = await loadCellInfo(packagejson.name)
    if (await exists(path.join(process.cwd(), 'Dockerfile')) && mode === 'production') {
      let contents = await readFile(path.join(process.cwd(), 'Dockerfile'))
      console.log(contents.toString())
      return
    }
    if (await exists(path.join(process.cwd(), `Dockerfile.${mode}`))) {
      let contents = await readFile(path.join(process.cwd(), `Dockerfile.${mode}`))
      console.log(contents.toString())
      return
    }
    if (cellInfo.dna.cellKind === 'webcell' && mode === 'production') {
      console.log(`FROM nginx:latest
EXPOSE 80
COPY ./dist /usr/share/nginx/html
`)
    } else {
      let nodeVersion = '11.10.1'
      if (packagejson.engines && packagejson.engines.node) {
        nodeVersion = packagejson.engines.node
      }
      let common_deps = ['lib']
      if (packagejson.common_dependencies) {
        common_deps = packagejson.common_dependencies
      }
      console.log(`FROM node:${nodeVersion}-alpine
RUN apk update && apk upgrade && \
  apk add --no-cache bash git openssh

${common_deps.map(function (v) {
    return `COPY cells/node_modules/${v}/package*.json cells/node_modules/${v}/
RUN cd cells/node_modules/${v} && npm install --${mode}
`
  }).join('\n')}

COPY ${cellInfo.dna.cwd}/package*.json ${cellInfo.dna.cwd}/
RUN cd ${cellInfo.dna.cwd} && npm install --${mode}

COPY . .

WORKDIR ${cellInfo.dna.cwd}
ENV NODE_ENV ${mode}
CMD ${runCmd}`)
    }
  })
}
