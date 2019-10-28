const path = require('path')
const os = require('os')
// const findSkeletonRoot = require('organic-stem-skeleton-find-root')

module.exports = function (angel) {
  angel.on(/buildbase (.*) (.*)/, async function (angel) {
    let mode = angel.cmdData[1]
    let tag = angel.cmdData[2]
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    // let fullRepoPath = await findSkeletonRoot()
    // const loadCellInfo = require(path.join(fullRepoPath, 'cells/node_modules/lib/load-cell-info'))
    // let cellInfo = await loadCellInfo(packagejson.name)
    let buildDestinationPath = path.join(os.tmpdir(), packagejson.name + packagejson.version + '-' + Math.random())
    console.log(`building into ${buildDestinationPath}`)
    let imageTag = tag
    let cmds = []
    // use as it is for development
    cmds = cmds.concat([
      // move cell's code into its appropriate place
      // use angel cp to exclude gitingored files
      `npx angel cp ./ ${buildDestinationPath}/`,
      // inject dockerfile into building container root
      `npx angel dockerbase ${mode} > ${buildDestinationPath}/Dockerfile`
    ])
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
