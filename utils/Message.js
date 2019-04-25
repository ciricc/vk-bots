class Message {
  constructor (options = {}) {
    
    if (typeof options === "string") options = {
      text: options
    }

    let messageRaw = {}
    
    if (options.attachments !== undefined) 
      this.attachments = options.attachments
    
    if (options.text !== undefined) 
      this.text = options.text
    if (options.keyboard !== undefined) 
      this.keyboard = options.keyboard
    if (options.asReply !== undefined) 
      this.asReply = options.asReply
  }
}

module.exports = Message