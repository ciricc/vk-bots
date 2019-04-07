const FastEventEmitter = require('fast-event-emitter')

function hashCode (s) {
  var hash = 0; var i; var chr
  if (s.length === 0) return hash

  for (i = 0; i < s.length; i++) {
    chr = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + chr
    hash |= 0 // Convert to 32bit integer
  }

  return hash
}

class Dialog {
  constructor (instance, dName = 'defaultDialog') {
    this.commands = {}
    this.instance = instance
    this.dialogName = dName
    this.buttons = {}
    this.prefixes = []
    this._cache = {}

    this.defaultKeyBoard = null

    this.initer = function () {}
    this._updateCachedCommands()
  }

  addPrefix (prefix = '') {
    this.prefixes.push(prefix.toString())
    return this
  }

  addDefaultKeyBoard (kb = []) {
    if (kb && kb.length) this.defaultKeyBoard = kb
    return this
  }

  createButton (text, color = 'default', payload = {}) {
    let obj = {
      action: {
        type: 'text',
        label: text,
        payload: payload
      },
      color: color
    }

    let btn = new Button(obj)

    this.buttons[btn.id] = btn

    return this.buttons[btn.id]
  }

  deleteButton (button = {}) {
    if (this.buttons[button.id]) {
      delete this.buttons[button.id]
    }
  }

  _updateCachedCommands () {
    let commands = Object.keys(this.commands)
    this._cache = commands
    this._cacheIndexes = [...commands]
    this._cache.forEach((cm, i) => {
      this._cache[i] = new RegExp(cm, 'gi')
    }, this)
  }

  setIniter (cb) {
    this.initer = cb

    return this
  }

  command (regexp, cb = Function, btn = null) {
    let self = this

    let argsRegExp = /\s?({(.*?)}\s?)/g

    let args = (regexp.match(argsRegExp) || []).map(arg => arg.replace(/(\{|\}|\s)/g, ''))
    regexp = regexp.replace(argsRegExp, '')

    let commandRegExp = '^(' + (this.prefixes.join('|')) + ')?' + regexp + '(.*?)([ ]+)?$'
    let command = self.commands[commandRegExp]

    if (!command) {
      if (btn) {
        btn.on('click', cb)
      }

      self.commands[commandRegExp] = {
        handlers: [cb],
        args: args,
        button: btn
      }
    } else {
      self.commands[commandRegExp].handlers.push(cb)
    }

    this._updateCachedCommands()
  }

  defaultCommand (handler = {}) {
    this.defaultCommand = handler
  }

  async initCommand (msg = {}, handler = null, variables = {}) {
    let self = this

    let text = msg.text

    variables = {}

    let thread = {
      msg: msg,
      thread: variables
    }

    let answered = false

    if (this.instance.middleware) {
      let ans = await this.instance.middleware(thread, Object.assign({}, {
        msg,
        reply: replyFunc,
        clearDialogs: clearDialogsFunc,
        backDialog: backDialogFunc,
        changeDialog: changeDialogFunc,
        revoke,
        args: {}
      }))

      if (ans === false) answered = true
    }

    variables = thread.thread || {}

    text = text.replace(/^\[club(.*?)\](\s)?/, '').replace(/&quot;/g, '"')

    let args = {}
    let args_ = Utils._getArgs(text)
    let _command = args_[0]

    args_.splice(0, 1)

    args = Object.assign(args, variables)

    if (answered) return true
    if (handler) {
      answered = true
      handler.call(this, Object.assign(args, {
        msg,
        reply: replyFunc,
        changeDialog: changeDialogFunc,
        backDialog: backDialogFunc,
        clearDialogs: clearDialogsFunc,
        revoke
      }))
    }

    if (msg.payload) {
      try {
        msg.payload = typeof msg.payload === 'object' ? msg.payload : JSON.parse(msg.payload)
        // console.log(msg.payload)
      } catch (e) {
        msg.payload = {}
      }
    }

    if (msg.payload && msg.payload.bid) {
      let hasButton = this.buttons[msg.payload.bid]
      if (hasButton) {
        answered = true
        hasButton.emit('click', Object.assign(args, {
          reply: replyFunc,
          button: true,
          changeDialog: changeDialogFunc,
          backDialog: backDialogFunc,
          clearDialogs: clearDialogsFunc,
          msg,
          revoke
        }))

        return true
      }
    }

    function revoke () {
      answered = false
    }

    function backDialogFunc (needInit = true, ifNotExists) {
      let userDialogs = self.instance.userDialogs[msg.peer_id]

      if (!userDialogs) {
        userDialogs = self.instance.userDialogs[msg.peer_id] = [ifNotExists]
      }

      if (userDialogs.length && self.instance.dialogs[userDialogs[userDialogs.length - 2]]) {
        userDialogs.splice(userDialogs.length - 1, 1)

        if (!userDialogs.length) {
          userDialogs.push('defaultDialog')
        }

        if (needInit) {
          self.instance.dialogs[userDialogs[userDialogs.length - 1]].initer(Object.assign(args, {
            msg,
            reply: replyFunc,
            revoke
          }))
        }
      } else {
        if (ifNotExists && self.instance.dialogs[ifNotExists]) {
          self.instance.userDialogs[msg.peer_id] = [ifNotExists]
          if (needInit) {
            self.instance.dialogs[ifNotExists].initer(Object.assign(args, {
              msg,
              reply: replyFunc,
              revoke
            }))
          }
        } else {
          userDialogs.splice(userDialogs.length - 1, 1)
          if (needInit !== false) {
            self.instance.initer(Object.assign(args, {
              msg,
              reply: replyFunc,
              revoke
            }))
          }
        }
      }
    }

    function changeDialogFunc (dialogName, needInit = true) {
      if (self.instance.dialogs[dialogName]) {
        if (!self.instance.userDialogs[msg.peer_id]) {
          self.instance.userDialogs[msg.peer_id] = []
        }

        let userDialogs = self.instance.userDialogs[msg.peer_id]

        if (userDialogs[userDialogs.length - 1] !== dialogName) {
          self.instance.userDialogs[msg.peer_id].push(dialogName)
        }

        if (needInit) {
          return self.instance.dialogs[dialogName].initer(Object.assign(args, {
            msg,
            reply: replyFunc,
            clearDialogs: clearDialogsFunc,
            backDialog: backDialogFunc,
            changeDialog: changeDialogFunc,
            revoke,
            args: args_
          }))
        }
      }
    }

    function clearDialogsFunc () {
      self.instance.userDialogs[msg.peer_id] = []
    }

    function replyFunc (msgText = 'Message not selected', buttons = null, attachment = [], method = 'call', markAnswered = false) {
      let props = {}

      if (attachment && attachment.length) {
        props.attachment = Array.isArray(attachment) ? attachment.join(',') : attachment
      }

      if (!buttons) buttons = self.defaultKeyBoard

      if (buttons) {
        let kb = {
          one_time: false,
          buttons: buttons
        }

        kb = JSON.stringify(kb)

        if (self.instance.userStates[msg.peer_id].currentKeyBoard !== kb) {
          props.keyboard = kb
          self.instance.userStates[msg.peer_id].currentKeyBoard = kb
        }
      }

      let req = 'call'

      if (props.keyboard) {
        req = 'post'
      }

      if (method !== req) {
        req = method
      }

      let randId = new Date().getTime() + '' + Math.floor(Math.random() * 1000)
      let complete = Object.assign(props, {
        message: msgText,
        peer_id: msg.peer_id,
        random_id: props.random_id ? props.random_id : randId
      })

      return self.instance.vkG[req]('messages.send', complete)
    }

    this._cache.forEach((command, i) => {
      let matched = text.match(command)

      if (matched && !answered) {
        let cm = this.commands[this._cacheIndexes[i]]

        cm.args.forEach((arg, i) => {
          args[arg] = args_[i]
        })

        cm.handlers.forEach((handler) => {
          answered = true

          handler.call(this, Object.assign(args, {
            reply: replyFunc,
            match: matched,
            changeDialog: changeDialogFunc,
            backDialog: backDialogFunc,
            clearDialogs: clearDialogsFunc,
            msg,
            _command,
            revoke,
            args: args_
          }
          ))
        }, this)
      }
    }, this)

    return answered
  }

  async initDefaultCommand (msg, thread = {}) {
    if (this.defaultCommand) {
      return this.initCommand(msg, this.defaultCommand, thread)
    }
  }
}

class Utils {
  static _getArgs (input) {
    let args = []; let quoteNeedString = false
    let complete = []

    args = input.split(' ')
    args.forEach(arg => {
      if (['"', "'", '`'].indexOf(arg[0]) !== -1 && arg.length > 1) {
        quoteNeedString = arg[0]

        if (arg[arg.length - 1] === arg[0]) {
          arg = arg.slice(0, -1)
        }

        complete.push(arg.slice(1))
      } else {
        if (quoteNeedString) {
          if (arg[arg.length - 1] === quoteNeedString) {
            quoteNeedString = false
            let pLast = arg.slice(0, arg.length - 1)
            if (pLast.length > 0) complete[complete.length - 1] += ' ' + pLast
          } else {
            complete[complete.length - 1] += ' ' + arg
          }
        } else {
          if (arg.length !== 0) {
            let arg_ = arg.toLocaleLowerCase()

            if (['false', 'true'].indexOf(arg_) !== -1) {
              arg_ = Boolean(arg_ === 'true')
            } else if ((!isNaN(arg_))) {
              arg_ = Number(arg_)
            }

            complete.push(arg)
          }
        }
      }
    })

    return complete
  }
}

class Button extends FastEventEmitter {
  constructor (obj = {}) {
    super()

    Object.assign(this, obj)

    this.__events = undefined

    Object.defineProperty(this, '__events', {
      enumerable: false,
      value: {}
    })

    this.action = this.action || {}
    this.action.payload = this.action.payload || {}

    let id = hashCode(this.action.label) || hashCode(String(new Date().getTime()))

    Object.defineProperty(this, 'id', {
      enumerable: false,
      value: id
    })

    this.action.payload.bid = this.id

    this.action.payload = JSON.stringify(this.action.payload).replace(/\\/g, '')
  }
}

class ChatBot extends Dialog {
  constructor (vk = Function, vkGroup, settings = {}) {
    super()

    this.instance = this

    this.settings = settings

    this.vk = vk
    this.vkG = vkGroup

    this.groupId = this.vkG.session.groupId
    this.dialogs = {}
    this.userDialogs = {}

    this.userStates = {}

    this.middleware = null

    if (this.vkG.session.group_id) {
      this.groupId = this.vkG.session.group_id
    }

    this.routeGroup = this.routeGroup.bind(this)
  }

  defaultDialog (globaly = false) {
    this.dialogs['defaultDialog'] = (globaly) ? this : new Dialog(this)

    return this.dialogs['defaultDialog']
  }

  _initLongPolls () {
    let self = this

    if (self.userLongPoll) {
      self.userLongPoll.debug(({ data }) => {
        console.log(data)
      })
    }

    if (!self.settings.onlyGroup) {
      self.userLongPoll.on('message', async (msg) => {
        msg = self.msgToObj(msg)

        if (!msg.out) {
          let variables = {}
          let thread = {
            msg: msg,
            thread: variables
          }

          self.v = new Date().getTime()
          if (self.middleware) {
            await self.middleware(thread)
          }

          self.initCommandDialogs(msg, thread)
        }
      })
    }

    if (!self.settings.onlyUsers) {
      // self.botsLongPoll.debug(console.log)

      self.botsLongPoll.on('message_new', (msg) => {
        self.routeGroup(msg)
      })
    }
  }

  async routeGroup (msg) {
    let self = this

    if (!self.settings.onlyUsers && !self.settings.onlyGroup) {
      if (msg.peer_id < 2000000000) return
    }

    self.initCommandDialogs(msg, {})
  }

  async initCommandDialogs (msg, thread = {}) {
    if (!this.userStates[msg.peer_id]) {
      this.userStates[msg.peer_id] = {}
    }

    let answered = await this.initCommand(msg, null, thread)
    // console.log(this.userStates)

    if (!answered) {
      if (this.userDialogs[msg.peer_id] && this.userDialogs[msg.peer_id].length) {
        let userDialogs = this.userDialogs[msg.peer_id]
        let dialog = this.dialogs[userDialogs[userDialogs.length - 1]]

        if (dialog) {
          // console.log(dialog)
          answered = await dialog.initCommand(msg, null, thread)
          if (!answered) {
            answered = await this.dialogs[userDialogs[userDialogs.length - 1]].initDefaultCommand(msg, thread)
          }
        }
      } else if (this.dialogs['defaultDialog']) {
        answered = await this.dialogs['defaultDialog'].initCommand(msg, null, thread)
        if (!answered) {
          answered = await this.dialogs['defaultDialog'].initDefaultCommand(msg, thread)
        }
      }
    }

    if (!answered) {
      return this.initDefaultCommand(msg, thread)
    }
  }

  msgToObj (msg = []) {
    return {
      out: msg[2] & 2,
      peer_id: msg[3],
      text: msg[5],
      payload: msg[6].payload
    }
  }

  async use (md) {
    this.middleware = md

    return this
  }

  async start () {
    if (this.vk && this.vk.session.user_id) {
      let connection

      if (!this.settings.onlyGroup) {
        let { connection: con } = await this.vk.longpoll.connect({
          forGetLongPollServer: {
            group_id: this.groupId
          }
        })
        connection = con
      }

      // connection.debug(console.log)
      this.userLongPoll = connection
    }

    if (this.vkG && !this.settings.onlyUsers) {
      let { connection } = await this.vkG.bots.longpoll.connect()
      this.botsLongPoll = connection
    }

    this._initLongPolls()
    return {
      user: this.userLongPoll,
      bot: this.botsLongPoll
    }
  }

  createDialog (dialogName = '') {
    let dialog = new Dialog(this, dialogName)
    this.dialogs[dialogName] = dialog

    return dialog
  }
}

module.exports = ChatBot
