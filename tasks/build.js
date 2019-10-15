const path = require('path')
const os = require('os')
const exists = require('file-exists')
const findSkeletonRoot = require('organic-stem-skeleton-find-root')

module.exports = function (angel) {
  angel.on('build', function (angel) {
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let tag = packagejson.name + ':' + packagejson.version
    angel.do(`build production ${tag}`)
  })
  angel.on('build :mode :tag', function (angel) {
    angel.do(`build ${angel.cmdData.mode} ${angel.cmdData.tag} -- npm run start`)
  })
  angel.on(/build (.*) (.*) -- (.*)/, async function (angel) {
    let mode = angel.cmdData[1]
    let tag = angel.cmdData[2]
    let runCmd = angel.cmdData[3]
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let fullRepoPath = await findSkeletonRoot()
    const loadCellInfo = require(path.join(fullRepoPath, 'cells/node_modules/lib/load-cell-info'))
    let cellInfo = await loadCellInfo(packagejson.name)
    let buildDestinationPath = path.join(os.tmpdir(), packagejson.name + packagejson.version + '-' + Math.random())
    console.log(`building into ${buildDestinationPath}`)
    let imageTag = tag
    let cmds = []
    if (packagejson.scripts.compile && mode !== 'development') {
      console.log(`compiling:`, packagejson.scripts.compile)
      cmds.push('npm run compile')
    }
    if (await exists(path.join(process.cwd(), 'Dockerfile')) && mode === 'production') {
      cmds.push(`docker build -t ${imageTag} .`)
      console.log('building:', cmds.join(' && '))
      await angel.exec(cmds.join(' && '))
      console.log(`done, build ${imageTag}`)
      return
    }
    if (await exists(path.join(process.cwd(), `Dockerfile.${mode}`))) {
      cmds.push(`docker build -t ${imageTag} -f ${path.join(process.cwd(), `Dockerfile.${mode}`)} .`)
      console.log('building:', cmds.join(' && '))
      await angel.exec(cmds.join(' && '))
      console.log(`done, build ${imageTag}`)
      return
    }
    // webcells in production are compiled using buildin dockerfile, see
    // ./docker.js
    if (cellInfo.dna.cellKind === 'webcell' && mode === 'production') {
      cmds = cmds.concat([
        // create dest folder
        `mkdir -p ${buildDestinationPath}`,
        // move cell's code into its appropriate place
        `cp -rL ./dist ${buildDestinationPath}`,
        // inject dockerfile into building container root
        `npx angel docker ${mode} -- ${runCmd} > ${buildDestinationPath}/Dockerfile`
      ])
    } else {
    // use as it is for development
      cmds = cmds.concat([
        // move cell's code into its appropriate place
        // use angel cp to exclude gitingored files
        `npx angel cp ./ ${buildDestinationPath}/`,
        // inject dockerfile into building container root
        `npx angel docker ${mode} -- ${runCmd} > ${buildDestinationPath}/Dockerfile`
      ])
    }
    cmds = cmds.concat([
      // build the container
      `cd ${buildDestinationPath}`,
      `docker build -t ${imageTag} .`
    ])
    console.log('building:', cmds.join(' && '))
    await angel.exec(cmds.join(' && '))
    console.log(`done, build ${imageTag}`)
  })
}
