const path = require('path')
const os = require('os')
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
    // compile for production
    if (packagejson.scripts.compile && mode === 'production') {
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
    // use as it is for development
      cmd = [
        // move cell's code into its appropriate place
        // use angel cp to exclude gitingored files
        `npx angel cp ./ ${buildDestinationPath}/`,
        // inject dockerfile into building container root
        `npx angel docker ${mode} -- ${runCmd} > ${buildDestinationPath}/Dockerfile`
      ]
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
