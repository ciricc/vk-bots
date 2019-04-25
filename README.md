# vk-bots
A simple library for quickly creating functional and responsive vkontakte bots

<i>Простая библиотека для быстрого создания функциональных и отзывчивых ботов ВКонтакте</i>

## Идея
Сделать доступное и простое решение для быстрого запуска функциональных чат-ботов под платформу ВКонтакте.

Библиотека работает на основе библиотеки <a href="https://github.com/ciricc/easyvk">easyvk</a>, поэтому, чтобы приступить к работе с vk-bots, надо понимать, как работает easyvk. Тем не менее, использование easyvk в библиотеке сводится к минимуму, поэтому vk-bots - это не easyvk, это его узконаправленный модуль, не более чем

## Быстрый старт

Коротко: библиотека работает на "приемниках" (раньше я их называл диалогами, но во время практики оказалось, что диалоги слишком сложно воспринимать)

Каждый приемник - своеборазное окно со своими внутренними командами. Если поступает какая-то команда от пользователя, то вместо того, чтобы проверять все команды бота, библиотека направит сообщение на нужный приемник, который уже будет искать команду внутри себя. Таким образом внутри каждого приемника есть собственные команды, а внешние команды из других приемников не должны никак затрагивать его собственные.

Перемещение между приемниками происходит за счет объекта History, который может напомнить обычный объект истории браузера, например. 

Каждый приемник имеет свое собственное имя. Вы можете называть их одинаково, только, если не добавляете в бота (подробнее ниже), так как в боте все приемники должны иметь уникальные названия.

При работе с приемником вы можете добавить в него команды. Команды - простые объекты, которые имеют некоторое описание: оргументы команды, значительные или незначительные. Типы аргументов для удобства и упрощения кода, единственная функция-хендлер и кнопки, при нажатии на которые будет срабатывать команда.

<b>Обычное сообщение пользователя - это внешняя команда</b>

### Приступим

Для начала работы нам понадобится создать нашего бота.
Я рекомендую выполнять все действия в асинхронной функции-обертке, чтобы делать некоторые функции синхронными

Прежде чем приступить к работе с библиотекой, убедитесь, что у вас включены возможности для чат-ботов в настройках сообщества и правильно настроен longpoll api (необходимо выбрать самую последнюю версию API и включить нужные события, как минимум, входящие сообщения)

```javascript
const {
  Bot
} = require('vk-bots')

async function main () {

  let bot = new Bot({
    token: 'TOKEN' // access_token вашей группы
  })


  // Запускаем бота
  let connection = await bot.start()
  console.log('Бот запущен!')
}

main()
```

Добавим нашу первую простую команду

```javascript
bot.command('начать', async (message) => {
  message.reply('Привет! Я новый чат-бот для тебя и твоих друзей')
})
```

Первый аргумент - это строка регулярного выражения. Вы можете изменять ее как вам хочется, чтобы выбрать для себя максимально точный запрос пользователя

```javascript
bot.command('н(а)?ч(а)?ть', async (message) => {
  message.reply('Привет! Я новый чат-бот для тебя и твоих друзей')
})
```
Все просто:

`начать` - сработает
`нчать` - сработает
`нчть` - сработает
`начть` - сработает

#### Давайте попробуем сделать наш первый приемник

На самом деле, мы уже сделали наш первый применик - это сам чат-бот.
Да, объект `Bot` наследует все свойства и методы объекта `Receiver` (приемника), что позволяет сделать основным приемником - чат-бота, а все остальные - это его ответвлениями

```javascript
const {
  ...,
  Receiver // Добавьте эту строчку сверху
} = require('vk-bots')

const Profile = new Receiver('profile')

Profile.command('баланс', (message) => {
  message.reply('Ваш баланс: ' + 0) // Вы можете выводить баланс, например, из базы данных
})

// Даем знать боту, что у нас есть такой приемник
bot.addReceivers([Profile])
```

После того, как чат-бот узнал, что у нас есть такой приемник, как `profile` (не путайте с `Profile`), мы можем с ним работать.

Давайте сделаем так, чтобы, когда человек отправлял команду "профиль", он получал свой профиль, а также мог посмотреть дополнительные данные о себе. Для этого мы будем использовать объект `History` и один его метод, чтобы перемещаться между приемниками (профиль - это отдельный приемник)

```javascript

// Сначала нам нужно указать функцию-инициализатор
// Она будет вызвана, когда произойдет 
// переключение приемника-бота на приемник-профиль
Profile.onInit((message) => {
  message.reply('Это ваш профиль!\n\nЧтобы посмотреть свой баланс, введите команду "баланс", чтобы вернуться в главное меню, введите команду "меню"')
})

bot.command('профиль', (_, history) => {
  history.go('profile')
})

```

Пока что мы можем только попасть в профиль, и даже посмотреть баланс. Но надо бы еще от туда уметь выходить. А, кстати. Попробуйте внутри профиля ввести команду "профиль". У вас ничего не выйдет :)

```javascript
Profile.command('меню', (_, history) => {
  history.back() // Возвращаемся на один приемник назад
})
```

Теперь нам нужно задать инициализатор для главного приемника (при возвращении обратно)

```javascript
bot.onInit((message) => {
  message.reply('Добро пожаловать домой!')
})
```

Вот мы уже сделали нашего самого простейшего чат-бота. Дальше только больше.

#### Нехватает кнопок, согласны? 
Попробуем это исправить.

Для того, чтобы добавить кнопки, нам понадобится объект `Keyboard` (клавиатуры). Мы будем работать с ним.

Для простого понимания: клавиатура - это двумерный массив. Строка - это его первая мера, а кнопка внутри (колонка, можно еще) - это его вторая мера.

```javascript
Keyboard
[
  [Button, Button, Button], // строка 0
  [Button], // строка 1 
  [Button, Button, Button] // строка 2
]
```

Каждая кнопка - это отдельный объект. У каждой кнопки есть свой идентификатор, который получается на основе хеша текста с кнопки, а также цвета. Для бота две зеленые кнопки с одинаковым текстом - это одинаковые кнопки, также, как для пользователя.

При нажатии на кнопку срабатывает событие `click` (мы получаем его из `payload` кнопки, в котором есть идентификатор этой кнопки). На этом и будет основываться абсолютно все в клавиатурах

Попробуем на практике

```javascript
const {
  ...,
  Keyboard,
  Button // Добавьте эти две строчки
} = require('vk-bots')

let botKeyboard = new Keyboard([
  [
    new Button('Настройки', Button.GREEN)
  ],
  [
    new Button('Профиль', Button.BLUE),
  ]
])

// Мы можем указать, что клавиаутура одноразовая (на одно сообщение)
botKeyboard.oneTime(false) // Тут неодноразовая
```

Мы создали нашу клавиатуру. Чтобы бот смог ее отправлять, необходимо задать ее либо в команде, либо в приемнике, как клавиатуру по умолчанию.

Мы сделаем вторым способом

```javascript
bot.keyboard(botKeyboard)
```

Теперь клавиатура будет отправляться по умолчанию вместе с текстом сообщения, если она не изменена на другую (внутренняя оптимизация запросов, не более)

Пока что при клике на кнопку ничего срабатывать не будет. Происходит это потому что клик по кнопке в библиотеке - это клик по кнопке, а не команда. Чтобы это работало как команда, необходимо перейти к работе с расширенной командой. Для этого в библиотеке есть класс `Command`

```javascript
const {
  ...,
  Command // Добавьте эту строчку
} = require('vk-bots')

let profileCommand = new Command({
  match: 'профиль',
  handler: (_, history) => {
    history.go('profile')
  },
  buttons: [botKeyboard.rows[1][0]] // здесь мы указываем массив кнопок
  // при нажатии на одну из них, произойдет выполнение команды
})

bot.addCommand(profileCommand)

// Закоментируйте или удалите строчки первой упрощенной версии команды

// bot.command('профиль', (_, history) => {
//   history.go('profile')
// })
```

Знаете, я бы мог сказать, что больше вам и не надо, но в `vk-bots` есть еще немного хороших плюх, о которых речь пойдет ниже.

На данный момент мы уже сделали чат-бота с клавиатурой (которая, ктстати говоря, пока что отображается только в главном меню). Давайте сделаем что-нибудь посложнее, например, попросим ввести какие-то данные от пользователя, например, его любимый жанр музыки

### Ввод данных

Для этого у нас в клавиатуре уже имеется кнопка "Настройки". С ней и будем работать.

Сделаем второй вторичный приемник, назовем его `settings`


```javascript
const Settings = new Receiver('settings')
const SelectGenre = new Receiver('select_genre')


const settingsKeyboard = new Keyboard(
[
  [
    new Button('Выбрать любимый жанр', 'primary') // тут мы впервые указали цвет primary, а не Button.BLUE - так тоже можно
  ]
])

settingsKeyboard.addRow([new Button('Назад', 'negative')]) // Добавим строку в клавиатуру

Settings.keyboard(settingsKeyboard)

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
  let genres = SelectGenre.genres.slice(page * 5 - 5, 5)
  return genres.map((genre, i) => {
    return (i + 1) + '. ' + genre
  }).join('\n')
}


SelectGenre.onInit((message, history) => {
  history.selectGenre = {
    page: 1
  }
  // Каждые 5 жанров - 1 страница
  message.reply(SelectGenre.formatGenres(history.selectGenre.page))
})

bot.addCommand(new Command({
  match: 'настройки',
  handler: (_, history) => {
    history.go('settings')
  },
  buttons: [botKeyboard.rows[0][0]]
}))

bot.addReceivers([
  Profile,


  SelectGenre,
  Settings // Добавьте эти две строчки
])

````
Документация будет обновляться дальше. Пока что это BETA версия. То, что есть сейчас - это уже круто и уже работает :)