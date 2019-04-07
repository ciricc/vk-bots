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

```javascript

const easyvk = require('easyvk');
const VkBot = require('vk-bots');
async function main () {
  
  let group = await easyvk({
    access_token: '{ТОКЕН_ГРУППЫ}'
  })

  // null - это пропуск объекта vkUser для создания чат-ботов на User LongPoll
  // в следующих релизах это будет удалено
  let Bot = new VkBot(null, group, {
    onlyGroup: true
  })

  let cars = [
    "Acura", 
    "Alfa Romeo", 
    "Aston Martin", 
    "Audi", 
    "Bentley", 
    "BMW", 
    "Bugatti"
  ]

  let Dialogs = {
    selectCar: Bot.createDialog('select_car')
  }

  let Buttons = {
    selectCar: {
      cancel: Dialogs.selectCar.createButton('Отмена', 'negative')
    }
  }

  function myGarage () {
    return cars.map((n, i) => `${i + 1}. ${n}`).join('\n')
  }

  function selectCar (carNum = 0) {
    carNum += -1;
    if (!cars[carNum]) return 'Введите правильный номер машины';
    return `Вы выбрали машину под номером ${carNum + 1} - ${cars[carNum]}`;
  }

  Dialogs.selectCar.setIniter(async ({reply}) => {
    return reply(myGarage());
  });

  Dialogs.selectCar.defaultCommand = async ({msg, reply}) => {
    let carNum = msg.text;

    if (curNum && !isNaN(carNum)) {
      return reply(selectCar(Number(carNum)));
    }
    
    return reply('Введите правильное число');
  }

  Dialogs.selectCar.command('отмена', async ({backDialog}) => {
    return backDialog(true);
  }, Buttons.selectCar.cancel);

  Bot.command('машина {carNum}?', async ({carNum, reply, changeDialog}) => {

    if (curNum && !isNaN(carNum)) {
      return reply(selectCar(Number(carNum)));
    }

    return changeDialog('select_car');

  });

  Bot.defaultCommand = async ({ reply }) => {
    reply(
      `Чтобы выбрать машину, введите команду "машина {номер_машины}"`
    );
  }
}


main();

```