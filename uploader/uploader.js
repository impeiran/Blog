let uid = 1

const parseError = xhr => {
  let msg = ''
  let { responseText, responseType, status, statusText } = xhr
  if (!responseText && responseType === 'text') {
    try {
      msg = JSON.parse(responseText)
    } catch (error) {
      msg = responseText
    }
  } else {
    msg = `${status} ${statusText}`
  }

  const err = new Error(msg)
  err.status = status
  return err
}

const parseSuccess = xhr => {
  let response = xhr.responseText
  if (response) {
    try {
      return JSON.parse(response)
    } catch (error) {}
  }

  return response
}

class Uploader {
  constructor (option = {}) {

    const defaultOption = {
      url: '',

      wrapper: document.body,
      multiple: false,
      limit: -1,
      autoUpload: true,
      accept: '*',

      headers: {},
      data: {},
      withCredentials: false
    }

    this.setting = Object.assign(defaultOption, option)

    this._init()
  }

  _init () {
    this.uploadFiles = []

    this.input = this._initInputElement(this.setting)

    this.changeHandler = e => {
      const files = e.target.files
      const ret = this._callHook('choose', files)
      if (ret !== false) {
        this.loadFiles(ret || e.target.files)
      }
    }

    this.input.addEventListener('change', this.changeHandler)

    this.setting.wrapper.appendChild(this.input)
  }

  _initInputElement (setting) {
    const el = document.createElement('input')

    Object.entries({
      type: 'file',
      accept: setting.accept,
      multiple: setting.multiple,
      hidden: true
    }).forEach(([key, value]) => {
      el[key] = value
    })

    return el;
  }

  on (evt, cb) {
    if (evt && typeof cb === 'function') {
      this['on' + evt] = cb;
    }
    return this;
  }

  _callHook (evt, ...args) {
    if (evt && this['on' + evt]) {
      return this['on' + evt].apply(this, args)
    }

    return;
  }

  chooseFile () {
    this.input.value = ''
    this.input.click()
  }

  loadFiles (files) {
    if (!files) return false;

    const type = Object.prototype.toString.call(files)
    if (type === '[object FileList]') {
      files = [].slice.call(files)
    } else if (type === '[object Object]' || type === '[object File]') {
      files = [files]
    }

    if (this.limit !== -1 && 
        files.length && 
        files.length + this.uploadFiles.length > this.limit
    ) {
      this._callHook('exceed', files);
      return false;
    }

    this.uploadFiles = this.uploadFiles.concat(files.map(file => {
      if (file.uid && file.rawFile) {
        return file
      } else {
        return {
          uid: uid++,
          rawFile: file,
          fileName: file.name,
          size: file.size,
          status: 'ready'
        }
      }
    }))

    this._callHook('change', this.uploadFiles);
    this.setting.autoUpload && this.upload()

    return true
  }

  removeFile (file) {
    const id = file.id || file
    const index = this.uploadFiles.findIndex(item => item.id === id)
    if (index > -1) {
      this.uploadFiles.splice(index, 1)
      this._callHook('change', this.uploadFiles);
    }
  }

  clear () {
    this.uploadFiles = []
    this._callHook('change', this.uploadFiles);
  }

  upload (file) {
    if (!this.uploadFiles.length && !file) return;

    if (file) {
      const target = this.uploadFiles.find(item => item.uid === file.uid || item.uid === file)
      target && target.status !== 'success' && this._post(target) && console.log(111)
    } else {
      this.uploadFiles.forEach(file => {
        file.status === 'ready' && this._post(file)
      })
    }
  }

  _post (file) {
    if (!file.rawFile) return

    const { headers, data, withCredentials } = this.setting
    const xhr = new XMLHttpRequest()

    const formData = new FormData()
    formData.append('file', file.rawFile, file.fileName)

    Object.keys(data).forEach(key => {
      formData.append(key, data[key])
    })
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key])
    })

    file.status = 'uploading'

    xhr.withCredentials = !!withCredentials

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        file.status = 'error'
        this._callHook('error', parseError(xhr), file, this.uploadFiles)
      } else {
        file.status = 'success'
        this._callHook('success', parseSuccess(xhr), file, this.uploadFiles)
      }
    }

    xhr.onerror = e => {
      file.status = 'error'
      this._callHook('error', parseError(xhr), file, this.uploadFiles)
    }

    xhr.upload.onprogress = e => {
      const { total, loaded } = e
      e.percent = total > 0 ? loaded / total * 100 : 0
      this._callHook('progress', e, file, this.uploadFiles)
    }

    xhr.open('post', this.setting.url, true)
    xhr.send(formData)
  }

  destroy () {
    this.input.removeEventHandler('change', this.changeHandler)
    this.setting.wrapper.removeChild(this.input)
  }
}