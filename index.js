module.exports = async function (angel) {
  require('angelabilities-exec')(angel)
  require('./tasks/build')(angel)
  require('./tasks/docker')(angel)
  require('./tasks/publish')(angel)
  require('./tasks/cp')(angel)
}
