const Button = require('./Button')
const Utils = require('./Utils')
const Keyboard = require('./Keyboard')

class Command {
  constructor (options = {}) {
    if (!options.match) throw new Error('Options match is undefined!')
    if (!options.handler || typeof options.handler !== "function") throw new Error('Option handler must be function only')

    let argsRegExp = /\s?({(.*?)}\s?)/g

    let args = (options.match.match(argsRegExp) || []).map(arg => arg.replace(/(\{|\}|\s)/g, ''))
    let realArgs = Utils.getArgs(options.match);
    realArgs.map(arg => {
      return arg.replace(/{(\s)*/g, '{').replace(/(\s)*}/g, '}')
    })
    options.match = options.match.replace(argsRegExp, '')

    let commandRegExp = '^' + options.match + '(.*?)([ ]+)?$'
    
    
    if (!Array.isArray(options.buttons) && options.buttons !== undefined) options.buttons = [options.buttons]     

    let btnIds = [];




    let _args = {}

    if (options.keyboard && !(options.keyboard instanceof Keyboard)) {
      throw new Error('Keyboard must instances from Keyboard class')
    }



    if (options.keyboard) {
      for (let id in options.keyboard.buttons) {
        btnIds.push(id)
      }
    }

    if (options.buttons !== undefined) {
      options.buttons.forEach((btn) => {
        if (!(btn instanceof Button)) throw new Error('Buttons must content Button classes only')
        btnIds.push(btn.id)
        btn.on('click', (args) => {
          options.handler(...args)
        })    
      })
    } else {
      options.buttons = []
    }
    
    Object.assign(this, options)

    args.forEach((arg, i) => {
      _args[arg] = (options.args && options.args[arg]) ?  Object.assign(options.args[arg], {
        index: realArgs.indexOf(`{${arg}}`)
      }) : {
        index: realArgs.indexOf(`{${arg}}`),
        type: String,
        required: false
      }
    })

    let protectedProps ={
      commandRegExp: commandRegExp,
      args: _args,
      btnIds: btnIds
    }

    for (let prop in protectedProps) {
      Object.defineProperty(this, prop, {
        value: protectedProps[prop],
        writeable: false
      })
    }

    this.enabled = true;

  }
}

module.exports = Command