module.exports = async function (angel) {
  require('angelabilities-exec')(angel)
  require('./tasks/build')(angel)
  require('./tasks/buildbase')(angel)
  require('./tasks/docker')(angel)
  require('./tasks/dockerbase')(angel)
  require('./tasks/publish')(angel)
  require('./tasks/cp')(angel)
}
