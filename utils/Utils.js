class Utils {
  static getArgs (input) {
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

  static hashCode (s) {
    var hash = 0; var i; var chr
    if (s.length === 0) return hash

    for (i = 0; i < s.length; i++) {
      chr = s.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0 // Convert to 32bit integer
    }

    return hash
  }
}

module.exports = Utils