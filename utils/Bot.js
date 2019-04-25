const easyvk = require('easyvk')

const Receiver = require('./Receiver')
const ReceiveMessage = require('./ReceiveMessage')
const Message = require('./Message')
const History = require('./History')
const Utils = require('./Utils')
const Keyboard = require('./Keyboard')

class Bot extends Receiver {
  constructor (options = {}) {
    if (!options || !Object.keys(options).length) throw new Error('You need add options. It cant be empty')

    // default receiver name
    super('default');
    
    this.options = options;

    this.options.connection = this.options.connection || {}


    this.receivers = [];
    this.receiversNames = [];

    this.keyboards = {}
    this.histories = {}

    // EasyVK object
    this.vk = null;

  }

  addReceivers (arrayOfReceivers = []) {

    if (!Array.isArray(arrayOfReceivers)) throw new Error('Receivers must be array')

    arrayOfReceivers.forEach(receiver => {
      if (receiver.receiverName === 'default') throw new Error('Receiver can not have a default name!')
      this.receivers.push(receiver)
      this.receiversNames[receiver.receiverName] = this.receivers.length - 1; // Index of receiver
    })

    return this
  }

  async start () {
    return new Promise(async (resolve, reject) => {

      this.vk = await easyvk({
        access_token: this.options.token,
        utils: {
          bots: true
        },
        api_v: '5.95'
      });

      if (this.vk.session.group_id === undefined) throw new Error('Token must be only group type!')

      let longPollOptions = {
        forGetLongPollServer: Object.assign({
          group_id: this.vk.session.group_id
        }, (this.options.connection.connect || {})),
        forLongPollServer: Object.assign({}, (this.options.connection.poll || {}))
      }

      let { connection } = await this.vk.bots.longpoll.connect(longPollOptions)

      this.connection = connection;

      this.__InitHandlers();

      return resolve(connection);

    })
  }

  __InitHandlers () {
    this.connection.on("message_new", (msg) => {

      let history = this.histories[msg.peer_id]

      if (msg.payload && msg.payload[0] === "{") {
        try {
          msg.payload = JSON.parse(msg.payload)
        } catch (e) {
          msg.payload = {}
        }
      }

      if (!history) {
        history = new History()
        this.histories[msg.peer_id] = history
      }

      
      let currentReceiver = (history) ? 
        (history.location === "default") ? this :
          (history.location.receiverName) ? 
            history.location : 
            this.receivers[this.receiversNames[history.location]]
      : this;



      let {handler, buttons, args, keyboard} = currentReceiver.__InitCommand(msg)
      

      let handlerArgs = [
        new ReceiveMessage(this, msg, keyboard), 
        this.histories[msg.peer_id],
        {}
      ]
      
      let requiredFailed = false;

      if (args) {
        let commandArgs = Utils.getArgs(msg.text)
        // commandArgs = commandArgs.slice(1)
        let variables = {}
        
        for (let arg in args) {
          let argObj = args[arg]
          variables[arg] = commandArgs[argObj.index]
          if (argObj.type) {

            if (argObj.type === Number) {
              variables[arg] = Number(variables[arg])
              if (argObj.required && isNaN(variables[arg])) {
                requiredFailed = true;
                break;
              }
            } else if (argObj.type === Boolean) {
              
              if (argObj.required && ['false', 'true'].indexOf(variables[arg].toLowerCase()) === -1) {
                requiredFailed = true;
                break;
              }

              variables[arg] = Boolean(variables[arg] === 'true')

            } else {
              variables[arg] = String(variables[arg]);
              if (argObj.required && (!variables[arg].length || !variables[arg] || variables[arg] === "undefined")) {
                requiredFailed = true;
                break;
              }
            }
          }
        }

        handlerArgs[2] = variables
      }

      if (requiredFailed) return;

      let onChange = (state) => {
        
        if (state.receiverName) {
          handlerArgs[0] = new ReceiveMessage(this, msg, state.__defaultKeyboard)
          return state.__Init(...handlerArgs)
        }

        if (state === "default") {
          handlerArgs[0] = new ReceiveMessage(this, msg, this.__defaultKeyboard)
          return this.__Init(...handlerArgs)
        }

        let receiverIndex = this.receiversNames[state]
        if (receiverIndex === undefined) throw new Error('Undefined receiver name of history change')
        
        handlerArgs[0] = new ReceiveMessage(this, msg, this.receivers[receiverIndex].__defaultKeyboard)
        this.receivers[receiverIndex].__Init(...handlerArgs)
      }

      history.off('change', onChange)
      history.once('change', onChange)

  

      if (msg.payload && msg.payload.bid) {
        if (history.keyboard) {
          if (buttons) {
            // If receiver sent buttons, we need get button
            let emited = false;

            buttons.forEach(btn => {
              if (btn.id === msg.payload.bid) {
                btn.emit(currentReceiver.receiverName + currentReceiver.id + '_click', handlerArgs)
                emited = true;
              }
            })
            
            if (emited) return;
          } else {
            // If no have buttons in receiver, but button was clicked
            let kb = this.keyboards[history.keyboard]
            let coords = kb.buttons[msg.payload.bid]
            let btn = kb.rows[coords[0]][coords[1]]
            
            let handlerArgs = [
              new ReceiveMessage(this, msg, kb), 
              this.histories[msg.peer_id],
              {}
            ]
            
            btn.emit('click', handlerArgs)
          }
        }
      }

      if (handler) {
        try {
          handler(...handlerArgs)
        } catch (e) {
          console.error(e)
        }
      }

    })
  }

  async reply (originalMessage, message) {
    
    if (typeof message === "string") {
      message = new Message({
        text: message
      })
    }

    let msg = {
      peer_id: originalMessage.peer_id
    }
    
    if (message.text) msg.message = message.text
    if (message.attachments) msg.attachment = message.attachments.join(',')
    if (message.asReply) msg.reply_to = originalMessage.id
    
    if (!message.keyboard && originalMessage.keyboard) {
      message.keyboard = originalMessage.keyboard
    }

    if (message.keyboard && message.keyboard instanceof Keyboard) {
      if (this.histories[msg.peer_id].keyboard !== message.keyboard.id || this.keyboards[this.histories[msg.peer_id].keyboard].oneTime) {
        this.histories[msg.peer_id].keyboard = message.keyboard.id
        this.keyboards[message.keyboard.id] = message.keyboard
        msg.keyboard = message.keyboard.toJSON();
      }
    } else if (message.keyboard) {
      throw new Error('Keyboard must be Keyboard class only')
    }

    if (this.histories[msg.peer_id].keyboard && !message.keyboard || this.histories[msg.peer_id].keyboard === undefined) {
      this.histories[msg.peer_id].keyboard = 0
      msg.keyboard = JSON.stringify({
        one_time: true,
        buttons: []
      })
    }

    if (Number(this.vk.params.api_v) >= 5.9) {
      msg.random_id = new Date().getTime() + '' + Math.floor(Math.random() * 1000)
    }

    return (msg.keyboard) ? this.vk.post('messages.send', msg)  : this.vk.call('messages.send', msg)
  }
}

module.exports = Bot;