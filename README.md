# vk-bots
A simple library for quickly creating functional and responsive vkontakte bots

<i>Простая библиотека для быстрого создания функциональных и отзывчивых ботов ВКонтакте</i>

## Идея
Сделать доступное и простое решение для быстрого запуска функциональных чат-ботов под платформу ВКонтакте.

Библиотека работает на основе библиотеки <a href="https://github.com/ciricc/easyvk">easyvk</a>, поэтому, чтобы приступить к работе с vk-bots, надо понимать, как работает easyvk

## Быстрый старт

Коротко: библиотека работает на диалогах. Каждый диалог - своеобразное окно, которое можно открыть, закрыть или использовать снова и снова. Каждый диалог имеет свои собственные команды и клавиатуры. Нет ничего проще, чем такая система (как мне кажется).

С помощью подобного подхода можно реализовать абсолютно любой чат-бот за считанные минуты, практически любой сложности. Такая система позволяет создавать внутенние системы диалогов, различных навигационных приспособлений по типу "выберите нужный вам автомобиль", и не прописывать для каждого действия кучу лишнего кода.

Система диалогов позволяет создавать таких чат-ботов, где каждый диалог не знает о командах других диалогов, но может управлять историей диалогов пользователя. Это значит, что находясь в главном меню, человек не сможет выбрать нужный ему автомобиль до тех пор, пока библиотека не переключит для него диалог. История диалогов для каждого пользователя своя. Вожно это понимать.

Пока что история диалогов хранится в оперативной памяти компьютера. Как показывает практика, для одного пользователя бывает достаточно 2-4 диалогов. Я стараюсь делать так, чтобы много памяти библиотека не занимала, и все работало очень быстро.

### Приступим

<b>Библиотека находится в BETA версии. Она писалась для проектов, которые сейчас уже работают, но пока что из нее не удалены полностью все лишние остатки и она не доделана до ума. Но вы реально уже сейчас можете ее тестировать, проверять, как оно, нравится или нет</b>

<img src="https://psv4.userapi.com/c848332/u356607530/docs/d17/43481803604b/corpwars5.gif?extra=5dvMvfJ5Tc_cgGUDEUAPo12MEL3Nd6D--Gy_o1UXC18BljMleNU717cNNFv8Sbv3KGr0SZAM9xGw64SeNCmS7fRhDGYltDbpK11awJ_kXTxB_bcJiLc4Ttk96cmQKBQz8VNfMEAILQczoPliks11j-4"/>

```javascript

const easyvk = require('easyvk')
const VkBot = require('vk-bots')

async function main () {
 
  let group = await easyvk({
    access_token: '06ab6360d97565080400b354635bbfe27629000bbf3efec08f95eae45a3a27b681b52aec1c6259d7b2e9a',
    session_file: __dirname + '/my-session',
    utils: {
      bots: true
    }
  });

  // null - это пропуск объекта vkUser для создания чат-ботов на User LongPoll
  // в следующих релизах это будет удалено

  let Bot = new VkBot(null, group, {
    onlyGroup: true
  });


  let cars = [
    'Acura',
    'Alfa Romeo',
    'Aston Martin',
    'Audi',
    'Bentley',
    'BMW',
    'Bugatti'
  ]

  // Я всегда делаю так, потому что так проще
  let Dialogs = {
    selectCar: Bot.createDialog('select_car')
  }

  // Создаем кнопки для всех диалогов. У каждого диалога - свои кнопки
  // Использование каких-то кнопок внутри других диалогов не будет работать!
  let Buttons = {
    selectCar: {
      cancel: Dialogs.selectCar.createButton('Отмена', 'negative'),
      apply: Dialogs.selectCar.createButton('Вывози давай', 'primary')
    },
    Bot: {
      clickMe: Bot.createButton('Кликни меня', 'positive')
    }
  }



  let users = {}

  // Именуем клавиатуру по умолчанию
  Dialogs.selectCar.addDefaultKeyBoard([[Buttons.selectCar.apply], [Buttons.selectCar.cancel]]);

  /*
   *  Создаем инциализирующую функцию диалога, она вызывается, когда
   *  вызывается диалог (переключение вперед-назад)
   *  
  */

  Dialogs.selectCar.setIniter(async ({ reply }) => 
    reply(myGarage(), Dialogs.selectCar.defaultKeyBoard)
  );

  // Команда по умолчанию, когда ни одна команда не сработала (не была вызвана)
  Dialogs.selectCar.defaultCommand = async ({ msg, reply }) => {
    let carNum = msg.text;

    if (carNum && !isNaN(carNum)) 
      return reply(selectCar(Number(carNum), msg.peer_id));

    return reply('Номер дай. Не вижу');
  }

  // Создаем команду "отмена" - текстовое представление (RegExp) и кнопочное - selectCar.cancel
  Dialogs.selectCar.command('отмена', async ({ backDialog }) => backDialog(true), 
    Buttons.selectCar.cancel
  );

  // Команда "вывози"
  Dialogs.selectCar.command('вывози', async ({msg, backDialog, reply}) => {
    
    let selected = getSelected(msg.peer_id);

    return (
      selected ? (
        reply(selected, []), 
        backDialog(false)
      ) : reply('Ну ты сначала тачку-то выбери')
    );

  }, Buttons.selectCar.apply);
 
  /* 
   * Более сложная команда "машина {номер_машины}", где 
   * carNum - переменная, которая после будет передана в функцию, как обычное свойство
   * знак вопроса после означает, что переменная может быть опущена, и не обязательна
   *
   */

  Bot.command('машина {carNum}?', async ({ carNum, msg, reply, changeDialog }) => {
    if (carNum && !isNaN(carNum)) {
      let replyWith = selectCar(Number(carNum), msg.peer_id);
      let car = getSelected(msg.peer_id);
      console.log(replyWith, car)
      return (car) ? reply(car, [[Buttons.Bot.clickMe]]) : reply(replyWith, [[Buttons.Bot.clickMe]]);
    }

    return changeDialog('select_car');
  })


  Bot.defaultCommand = async ({ reply }) => 
    reply('Дай команду "машина {номер_машины}", я вывезу', 
      [[Buttons.Bot.clickMe]]
    )
  
  Bot.setIniter(async ({reply}) => 
    reply('Не подцепи ничего, братан. Покеда', [[Buttons.Bot.clickMe]])
  );

  /*
   *  Обрабатываем событи клика по кнопке. У каждой кнопки свой уникальный идентификатор,
   *  поэтому кликая по кнопке - вы именно кликаете по кнопке, а не делаете команду "клик"
   *  Может понадобится ботам, которые работают толькона кнопках и не поддерживают старые клиенты ВК
   * 
   */

  Buttons.Bot.clickMe.on('click', async ({reply}) => {
    return reply('Кликнул на кнопку, ну надо же :)', [[Buttons.Bot.clickMe]])
  })
  
  // После указания всех диалогов и их последовательностей, запускаем бота
  Bot.start().then(({bot}) => {
    console.log('Бот запущен!');  
    bot.on('group_join', console.log);
  });

  function myGarage () { return cars.map((n, i) => `${i + 1}. ${n}`).join('\n'); }

  function getSelected (uid = 0) {
    let user = users[uid];

    if (!user) return false;
    let car = cars[user.selectedCar];

    return `Понял. Принял. Вывожу из гаража тачку ${car}`;
  }

  function selectCar (carNum = 0, uid = 0) {
    carNum += -1;
  
    if (!cars[carNum] || carNum < 0) return 'Номер дай. Не вижу';
    
    users[uid] = {selectedCar: carNum};

    return `Выбираешь ${cars[carNum]}?`;
  }

}

main()


```