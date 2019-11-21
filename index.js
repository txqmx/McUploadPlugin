const path = require('path')
const oss = require('./src/mcoss') // mc-upload 的具体上传逻辑，直接拿过来用
const colors = require('colors/safe')

class McUploadPlugin {
  constructor (options) {
    let {
      appCode = '',
      ossTag = '',
      ossKey = '',
      env = 'development',
      prefix = '',
      excludes = []
    } = options
    this.ossServe = oss({
      env,
      ossTag,
      ossKey,
      appCode
    })
    this.prefix = prefix // 上传路径前缀
    this.excludes = Array.isArray(excludes) ? excludes : [] // 不上传文件列表
  }
  apply (compiler) {
    const outputPath = compiler.options.output.path // 资源打包路径
    compiler.hooks.afterEmit.tapPromise('McUploadPlugin', (compliation) => {
      let assets = compliation.assets
      let files = this.gstFiles(assets)
      if (files.length) {
        this.uploadAll(files, outputPath)
      } else {
        console.log(colors.red('没有文件可上传'))
      }
      return Promise.resolve()
    })
  }
  // 开始上传
  uploadAll (files, outputPath) {
    let promises = []
    files.forEach(filename => {
      promises.push(this.upload(filename, outputPath))
    })
    return Promise.all(promises).then(res => {
      console.log(colors.green('全部上传成功'))
    })
  }
  upload (filename, outputPath) {
    return new Promise((resolve, reject) => {
      let filePath = path.resolve(outputPath, filename) // 文件绝对路径
      filename = this.getFilename(filename)
      this.ossServe
        .upload(filename, filePath)
        .then(res => {
          if (res.error) {
            console.log(colors.red(`upload error: ${res.data.furl}`))
            reject(res.error)
          }
          console.log(colors.green(`upload success: ${res.data.furl}`))
          resolve(filePath)
        })
    })
  }
  // 获取文件列表
  gstFiles (assets) {
    let files = []
    Object.keys(assets).forEach(filename => {
      let flag = this.excludes.every(item => {
        return filename.indexOf(item) === -1
      })
      if (flag) {
        files.push(filename)
      }
    })
    return files
  }
  // 处理文件名称，兼容win
  getFilename (filename) {
    return path.join(this.prefix, filename).replace(/\\/g, '/')
  }
}
module.exports = McUploadPlugin
