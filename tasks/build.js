const path = require('path')
const os = require('os')
const exists = require('file-exists')

module.exports = function (angel) {
  angel.on('build', function (angel) {
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let tag = packagejson.name + ':' + packagejson.version
    angel.do(`build production ${tag}`)
  })
  angel.on('build :mode', function (angel) {
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let tag = packagejson.name + ':' + packagejson.version
    angel.do(`build ${angel.cmdData.mode} ${tag} -- npm run start`)
  })
  angel.on('build :mode :tag', function (angel) {
    angel.do(`build ${angel.cmdData.mode} ${angel.cmdData.tag} -- npm run start`)
  })
  angel.on(/^build (.*) (.*) -- (.*)/, async function (angel) {
    let mode = angel.cmdData[1]
    let imageTag = angel.cmdData[2]
    let runCmd = angel.cmdData[3]
    let packagejson = require(path.join(process.cwd(), 'package.json'))
    let buildDestinationPath = path.join(os.tmpdir(), packagejson.name + packagejson.version + '-' + Math.random())
    let cmds = []
    if (await exists(path.join(process.cwd(), 'Dockerfile'))) {
      cmds.push(`docker build -t ${imageTag} -f ${path.join(process.cwd(), `Dockerfile`)} .`)
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
    let shortMode = ''
    switch (mode) {
      case 'production': shortMode = 'prod'; break
      case 'development': shortMode = 'dev'; break
    }
    if (await exists(path.join(process.cwd(), `Dockerfile.${shortMode}`))) {
      cmds.push(`docker build -t ${imageTag} -f ${path.join(process.cwd(), `Dockerfile.${shortMode}`)} .`)
      console.log('building:', cmds.join(' && '))
      await angel.exec(cmds.join(' && '))
      console.log(`done, build ${imageTag}`)
      return
    }
    console.log(`building into ${buildDestinationPath}`)
    // use as it is for development
    cmds = cmds.concat([
      // move cell's code into its appropriate place
      // use angel cp to exclude gitingored files
      `npx angel cp ./ ${buildDestinationPath}/`,
      // inject dockerfile into building container root
      `npx angel docker ${mode} -- ${runCmd} > ${buildDestinationPath}/Dockerfile`
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
