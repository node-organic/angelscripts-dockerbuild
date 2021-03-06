const findSkeletonRoot = require('organic-stem-skeleton-find-root')

module.exports = function (angel) {
  angel.on('cp :src :dest', async function (angel) {
    let fullRepoPath = await findSkeletonRoot()
    let src = angel.cmdData.src
    let dest = angel.cmdData.dest
    // TODO: improve this implementation
    // perfectly replace the implementation with
    // recursive file and directory copy while respecting .gitignore files/rules as git does
    let cmd = `cd ${fullRepoPath} && mkdir -p ${dest} && uploadStash=\`git stash create\`; git archive --format tar \${uploadStash:-HEAD} ${src} | tar -C ${dest.replace(src, '')} -xvf -`
    console.log('copying:', cmd)
    angel.exec(cmd)
  })
}
