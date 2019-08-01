const path = require('path')
const os = require('os')
const findSkeletonRoot = require('organic-stem-skeleton-find-root')
const exists = require('file-exists')

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
    let cmd = ''
    if (await exists(path.join(process.cwd(), 'Dockerfile')) && mode === 'production') {
      let cmd = [
        `docker build -t ${imageTag} .`
      ].join(' && ')
      console.log('running:', cmd)
      await angel.exec(cmd)
      console.log(`done, build ${imageTag}`)
      return
    }
    if (await exists(path.join(process.cwd(), `Dockerfile.${mode}`))) {
      let cmd = [
        `docker build -t ${imageTag} -f ${path.join(process.cwd(), `Dockerfile.${mode}`)} .`
      ].join(' && ')
      console.log('running:', cmd)
      await angel.exec(cmd)
      console.log(`done, build ${imageTag}`)
      return
    }
    if (cellInfo.dna.cellKind === 'webcell' && mode === 'production') {
      cmd = [
        // build assets/js/css into /dist forlder
        `npm run compile`,
        // create dest folder
        `mkdir -p ${buildDestinationPath}`,
        // move cell's code into its appropriate place
        `cp -rL ./dist ${buildDestinationPath}`,
        // inject dockerfile into building container root
        `npx angel docker ${mode} -- ${runCmd} > ${buildDestinationPath}/Dockerfile`
      ]
    } else {
      let common_deps = ['lib']
      if (packagejson.common_dependencies) {
        common_deps = packagejson.common_dependencies
      }
      cmd = [
        // move cell's code into its appropriate place
        // use angel cp to exclude gitingored files
        `npx angel cp ${cellInfo.dna.cwd} ${buildDestinationPath}/${cellInfo.dna.cwd}`,
        // copy cell dna
        `npx angel cp dna ${buildDestinationPath}/dna`,
        // inject dockerfile into building container root
        `npx angel docker ${mode} -- ${runCmd} > ${buildDestinationPath}/Dockerfile`
      ]
      cmd = cmd.concat(common_deps.map(function (v) {
        return `npx angel cp cells/node_modules/${v} ${buildDestinationPath}/cells/node_modules/${v}`
      }))
    }
    cmd = cmd.concat([
      // build the container
      `cd ${buildDestinationPath}`,
      `docker build -t ${imageTag} .`
    ])
    cmd = cmd.join(' && ')
    console.log('running:', cmd)
    await angel.exec(cmd)
    console.log(`done, build ${imageTag}`)
  })
}
