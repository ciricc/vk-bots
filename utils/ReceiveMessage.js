class ReceiveMessage {
  constructor (bot, messageObject = {}, keyboardDefault = null) {
    Object.assign(this, messageObject);
    
    Object.defineProperty(this, "reply", {
      value: async (...args) => {
        return bot.reply({
          id: this.id,
          peer_id: this.peer_id,
          keyboard: keyboardDefault
        }, ...args)
      } 
    })
    
  }
}

module.exports = ReceiveMessage;