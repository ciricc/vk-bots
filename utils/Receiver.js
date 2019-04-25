const Command = require('./Command')
const Keyboard = require('./Keyboard')

class Receiver {
  constructor (name) {
    this.receiverName = name;
    
    this.id = String(new Date().getTime()) + String(Math.random() * 1000)

    this.handlers = [];
    this.commands = {}
    
    this.buttonsCommands = {}

    this.prefixes = [];

    this.__defaultKeyboard = null;
  }

  command (regexp, handler, buttons = []) {

    let command = new Command({
      match: regexp,
      handler: handler,
      buttons: buttons
    });

    return this.addCommand(command)
  }

  addCommand (command) {

    if (!(command instanceof Command)) throw new Error('Command must be Command class!!')

    if (this.commands[command.commandRegExp]) {
      throw new Error('This command already have!')
    }
    
    let indexOfHandler = this.handlers.indexOf(command.handler);

    if (indexOfHandler === -1) {
      this.handlers.push(command.handler);
      indexOfHandler = this.handlers.length - 1;
    }

    command.buttons.forEach(btn => {
      btn.on(this.receiverName + this.id + '_click', (args) => {
        command.handler(...args)
      })
    })

    command.btnIds.forEach(id => {
      this.buttonsCommands[id] = command.commandRegExp;
    })

    this.commands[command.commandRegExp] = command;

    return this;
  }

  keyboard (keyboard) {
    if (!(keyboard instanceof Keyboard)) throw new Error('Default keyboard must be Keyboard class only!')
    this.__defaultKeyboard = keyboard;
  }

  onInit (cb) {
    if (typeof cb !== "function") throw new Error('Handler must be only function')

    this.__initer = cb;

    return this
  }

  __Init (...args) {
    if (this.__initer) {
      try {
        this.__initer(...args)
      } catch (e) {
        console.error(e)
      }
    }
  }

  __InitCommand (message) {
    
    let handler = null;
    let buttons = null;
    let args = null;
    let keyboard = this.__defaultKeyboard;

    if (message.text) {
      if (message.payload && message.payload.bid) {
        let regexp = this.buttonsCommands[message.payload.bid]
        if (regexp) {
          handler = this.commands[regexp].handler;
          buttons = this.commands[regexp].buttons;
          args = this.commands[regexp].args;
        }
      } else {
        for (let regexp in this.commands) {
          if (message.text.match(new RegExp(regexp, 'gi'))) {
            handler = this.commands[regexp].handler;
            buttons = this.commands[regexp].buttons;
            args = this.commands[regexp].args;
            break;
          } 
        }
      }
    }

    return {handler, buttons, args, keyboard}
  }
}

module.exports = Receiver;