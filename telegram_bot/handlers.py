from aiogram import Router, F
from aiogram.filters import Command
from aiogram.types import KeyboardButton, Message, ReplyKeyboardMarkup
import api_client
from config import settings

router = Router()
telegram_users: dict[str, str] = {}


def keyboard() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="🐾 Кошачий режим"), KeyboardButton(text="😵‍💫 Пожиратель тревоги")],
            [KeyboardButton(text="🔥 Сжечь задачу"), KeyboardButton(text="⏱ 10 минут против часовых")],
            [KeyboardButton(text="🐱 Прогресс")],
        ],
        resize_keyboard=True,
    )


async def ensure_user(message: Message) -> str:
    telegram_id = str(message.from_user.id)
    if telegram_id not in telegram_users:
        display_name = message.from_user.full_name or "Студент"
        user = await api_client.create_user(display_name, telegram_id)
        telegram_users[telegram_id] = user["user_id"]
    return telegram_users[telegram_id]


@router.message(Command("start"))
async def start(message: Message):
    await ensure_user(message)
    await message.answer(
        f"Привет. Я {settings.app_name} — штука для тех, кто устал учиться, но всё ещё хочет как-то выжить в дедлайнах.\n\n"
        "Тут можно честно написать:\n«я туплю»\n«у меня дедлайн»\n«я устал»\n«я ничего не сделал»\n\n"
        "Я не буду ругать. Максимум — заверну тревогу в плед и дам микрошаг.",
        reply_markup=keyboard(),
    )


@router.message(Command("help"))
async def help_cmd(message: Message):
    await message.answer("/status, /topic, /ritual, /focus, /progress, /reset — или просто напиши, что происходит.", reply_markup=keyboard())


@router.message(Command("status", "topic"))
async def status(message: Message):
    await message.answer("Учебный контекст сейчас удобнее заполнить во вкладке «Настройки» веб-приложения. В боте можно писать обычным текстом.", reply_markup=keyboard())


@router.message(Command("ritual"))
async def ritual(message: Message):
    await message.answer("Выбери мягкий режим кнопкой ниже.", reply_markup=keyboard())


@router.message(Command("focus"))
async def focus(message: Message):
    user_id = await ensure_user(message)
    task = await api_client.start_focus(user_id)
    await message.answer(f"{task['task_title']}\n\n{task['task_text']}\n\nУсловие победы: {task['success_condition']}", reply_markup=keyboard())


@router.message(Command("progress"))
async def progress(message: Message):
    user_id = await ensure_user(message)
    data = await api_client.get_progress(user_id)
    await message.answer(
        f"Осколки отдыха: {data['rest_shards']}\n"
        f"Сонный котёнок: уровень {data['sleepy_kitten_level']}, прогресс {data['sleepy_kitten_progress']}%\n"
        f"Фокус-сессии: {data['completed_focus_rounds']}\nРитуалы: {data['completed_rituals']}",
        reply_markup=keyboard(),
    )


@router.message(Command("reset"))
async def reset(message: Message):
    user_id = await ensure_user(message)
    await api_client.reset_user(user_id)
    await message.answer("Данные пользователя сброшены.", reply_markup=keyboard())


@router.message(F.text == "🐾 Кошачий режим")
async def cat_mode(message: Message):
    user_id = await ensure_user(message)
    ritual = await api_client.start_ritual(user_id, "cat_mode")
    await message.answer(ritual["message"], reply_markup=keyboard())


@router.message(F.text == "😵‍💫 Пожиратель тревоги")
async def anxiety_mode(message: Message):
    await message.answer("Напиши тревожную мысль обычным сообщением. Я передам её backend, без отдельной магии в боте.", reply_markup=keyboard())


@router.message(F.text == "🔥 Сжечь задачу")
async def task_burner(message: Message):
    await message.answer("Напиши страшную задачу обычным сообщением, а веб-вкладка «Ритуалы» умеет превращать её в 3 микрошага.", reply_markup=keyboard())


@router.message(F.text == "⏱ 10 минут против часовых")
async def focus_button(message: Message):
    await focus(message)


@router.message(F.text == "🐱 Прогресс")
async def progress_button(message: Message):
    await progress(message)


@router.message(F.text)
async def text_message(message: Message):
    user_id = await ensure_user(message)
    response = await api_client.send_chat(user_id, message.text)
    await message.answer(response["reply"], reply_markup=keyboard())
