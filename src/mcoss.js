const request = require('request-promise-native')
const md5 = require('md5')
const base64 = require('base-64')
const fs = require('fs')

const conf = require('../config/index')

const oss = ({
  env = 'production',
  ossTag = '',
  ossKey = '',
  appCode = '',
  uid = '',
  uname = ''
}) => {
  if (!ossTag || !ossKey || !appCode) {
    throw new Error('ossTag, ossKey or appCode is required')
  }
  let uploadUrl = conf[env].upapi
  let expires = Math.floor(new Date().getTime() / 1000 + 3600)
  let token = md5(ossTag + ossKey + expires)
  let ossAuth = base64.encode('{"tag":"' + ossTag + '","expires":"' + expires + '","token":"' + token + '"}')
  const upload = (filename, filepath) => {
    let formData = {
      uid,
      uname,
      object: filename,
      file: fs.createReadStream(filepath)
    }
    return request({
      method: 'POST',
      uri: uploadUrl,
      formData,
      headers: {
        'Oss-auth': ossAuth,
        'Connection': 'alive',
        'App-Code': appCode
        // 'Accept-Encoding': 'gzip, deflate'
        // 'Content-Type': 'multipart/form-data'
      },
      json: true
    })
  }
  return {
    upload
  }
}

module.exports = oss
