const easyvk = require('easyvk')
const {
  Bot,
  Receiver,
  Keyboard,
  Button,
  Command
} = require('../index')

async function main () {

  let bot = new Bot({
    token: 'TOKEN' // access_token вашей группы
  })

  let botKeyboard = new Keyboard(
    [
      [
        new Button('Настройки', Button.GREEN)
      ],
      [
        new Button('Профиль', Button.BLUE),
      ]
    ]
  )

  bot.command('н(а)?ч(а)?ть', async (message) => {
    message.reply('Привет! Я новый чат-бот для тебя и твоих друзей')
  })

  const Profile = new Receiver('profile')
  const Settings = new Receiver('settings')
  const SelectGenre = new Receiver('select_genre')

  const selectGenreKeyboard = new Keyboard(
    [
      [new Button('<-'), new Button('->')],
      [new Button('Назад', 'negative')]
    ]
  )

  
  const settingsKeyboard = new Keyboard(
    [
      [
        new Button('Выбрать любимый жанр', 'primary') // тут мы впервые указали цвет primary, а не Button.BLUE - так тоже можно
      ]
    ]
  )

  settingsKeyboard.addRow([new Button('Назад', 'negative')]) // Добавим строку в клавиатуру
  

  Settings.addCommand(new Command({
    match: 'жанр',
    handler: (_, history) => {
      history.go('select_genre')
    },
    buttons: settingsKeyboard.rows[0][0] // Мы можем указывать только одну кнопку
  }))

  Settings.onInit((message) => {
    message.reply('Выберите опцию, которую хотите изменить')
  })

  SelectGenre.genres = ["Rock", "Pop", "Rap & Hip-Hop", "Easy Listening", "Dance & House", "Instrumental", "Metal", "Dubstep", "Drum & Bass", "Trance", "Chanson", "Ethnic", "Acoustic & Vocal", "Reggae", "Classical", "Indie Pop", "Other", "Speech", "Alternative", "Electropop & Disco", "Jazz & Blues"];

  SelectGenre.formatGenres = (page = 1) => {
    page = Number(page)
    let genres = SelectGenre.genres.slice(page * 5 - 5, page * 5)
    let str = genres.map((genre, i) => {
      return (i + 1 + 5 * (page - 1)) + '. ' + genre
    }).join('\n')

    return str
  }

  SelectGenre.next = ([message, history]) => {
    history.selectGenre.page += 1
    if (history.selectGenre.page * 5 - 5 > SelectGenre.genres.length) {
      history.selectGenre.page -= 1;
      return message.reply('У нас все! Теперь только назад')
    }
    return message.reply(SelectGenre.formatGenres(history.selectGenre.page))
  }

  SelectGenre.prev = ([message, history]) => {
    history.selectGenre.page -= 1
    if (history.selectGenre.page * 5 - 5 < 0) {
      history.selectGenre.page += 1;
      return message.reply('У нас все! Теперь только вперед')
    }
    return message.reply(SelectGenre.formatGenres(history.selectGenre.page))
  }

  selectGenreKeyboard.rows[0][1].on('click', SelectGenre.next)
  selectGenreKeyboard.rows[0][0].on('click', SelectGenre.prev)


  SelectGenre.onInit((message, history) => {
    history.selectGenre = {
      page: 1
    }
    // Каждые 5 жанров - 1 страница
    message.reply(SelectGenre.formatGenres(history.selectGenre.page))
  })

  SelectGenre.addCommand(
    new Command({
      match: '{genreId}',
      args: {
        genreId: {
          type: Number,
          required: false
        }
      },
      handler: async (message, history, { genreId }) => {
        if (!SelectGenre.genres[genreId - 1]) return message.reply('Такого жанра в списке нет')
        await message.reply(`Вы выбрали жанр ${SelectGenre.genres[genreId - 1]}! Поздравляем, у вас хороший вкус!\n\nЧтобы вернуться назад, введите команду "назад"`)
        history.selectGenre = {page: 1}
      }
    })
  )

  let backCommand = new Command({
    match: 'назад',
    handler: (_, history) => {
      history.back()
    },
    buttons: selectGenreKeyboard.rows[1][0]
  })

  Settings.addCommand(backCommand)
  SelectGenre.addCommand(backCommand)

  bot.addCommand(new Command({
    match: 'настройки',
    handler: (_, history) => {
      history.go('settings')
    },
    buttons: [botKeyboard.rows[0][0]]
  }))

  Profile.command('баланс', (message) => {
    message.reply('Ваш баланс: ' + 0) // Вы можете выводить баланс, например, из базы данных
  })

  Profile.command('меню', (_, history) => {
    history.back() // Возвращаемся на один приемник назад
  })

  Profile.onInit((message) => {
    message.reply('Это ваш профиль!\n\nЧтобы посмотреть свой баланс, введите команду "баланс", чтобы вернуться в главное меню, команду "меню"')
  })

  // Даем знать боту, что у нас есть такой приемник
  bot.addReceivers([Profile, Settings, SelectGenre])
  
  let profileCommand = new Command({
    match: 'профиль',
    handler: (_, history) => {
      history.go('profile')
    },
    buttons: [botKeyboard.rows[1][0]]
  })

  bot.addCommand(profileCommand)

  bot.onInit((message) => {
    message.reply('Добро пожаловать домой!')
  })

  SelectGenre.keyboard(selectGenreKeyboard)
  Settings.keyboard(settingsKeyboard)

  bot.keyboard(botKeyboard)

  // Запускаем бота
  let connection = await bot.start()
  console.log('Бот запущен!')
}

main()