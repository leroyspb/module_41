const messagesContainer = document.getElementById("messagesContainer");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const statusDot = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");
const locationBtn = document.getElementById("locationBtn");

let websocket;

// Функция для добавления системного сообщения
function addSystemMessage(text) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "message-system");

  const time = new Date();
  const timeString = `${time.getHours()}:${time
    .getMinutes()
    .toString()
    .padStart(2, "0")}`; // padStart делает чтобы точно было 2 цифры

  messageDiv.innerHTML = `
                ${text}
                <div class="message-time">${timeString}</div>
            `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Функция для добавления нового сообщения
function addMessage(text, isSender = true) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message");
  messageDiv.classList.add(isSender ? "message-sender" : "message-server");

  const time = new Date(); //отображает текущее время внутри системного сообщения
  const timeString = `${time.getHours()}:${time
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  messageDiv.innerHTML = `
                ${text}
                <div class="message-time">${timeString}</div>
            `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Функция для добавления сообщения с геолокацией
function addLocation(latitude, longitude) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", "message-sender", "message-location");

  const time = new Date(); //отображает текущее время внутри сообщения с геолокацией
  const timeString = `${time.getHours()}:${time
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;

  // Создаем ссылку на OpenStreetMap
  const osmUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`;

  messageDiv.innerHTML = `
                <div class="location-message">
                    <strong>📍 Моя геолокация</strong><br>
                    <a href="${osmUrl}" target="_blank" class="location-link">
                        Открыть на карте OpenStreetMap
                    </a><br>
                    <small>Координаты: ${latitude.toFixed(
                      6
                    )}, ${longitude.toFixed(6)}</small>
                </div>
                <div class="message-time">${timeString}</div>
            `;

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Функция подключения к эхосерверу WebSocket
function connectWebSocket() {
  try {
    websocket = new WebSocket("wss://echo.websocket.org"); // рабочий сервер
    // websocket = new WebSocket('wss://echo-ws-service.herokuapp.com'); // сервер из задания

    websocket.onopen = function (event) {
      statusDot.classList.add("connected");
      statusText.textContent = "Подключено";
      messageInput.placeholder = "Введите сообщение...";
      messageInput.disabled = false;
      sendButton.disabled = false;
      locationBtn.disabled = false; // Разблокирует кнопку геолокации

      addSystemMessage("✅ Подключение к эхо-серверу установлено");
    };

    websocket.onmessage = function (event) {
      // Игнорируем ответы сервера для сообщений типа location
      try {
        const data = JSON.parse(event.data);
        if (data.type === "location") {
          return; // Не показываем эхо от сервера
        }
      } catch (e) {
        // Если не JSON, показываем обычное сообщение
        addMessage(event.data, false);
      }
    };

    websocket.onclose = function (event) {
      statusDot.classList.remove("connected");
      statusText.textContent = "Отключено";
      messageInput.placeholder = "Переподключение...";
      messageInput.disabled = true;
      sendButton.disabled = true;
      locationBtn.disabled = true; // Блокируем кнопку геолокации

      addSystemMessage(
        "❌ Соединение закрыто. Попытка переподключения через 3 секунды..."
      );

      // Автопереподключение через 3 секунды
      setTimeout(connectWebSocket, 3000);
    };

    websocket.onerror = function (error) {
      addSystemMessage("❌ Ошибка подключения к WebSocket");
      console.error("WebSocket error:", error);
    };
  } catch (error) {
    addSystemMessage("❌ Ошибка при создании WebSocket соединения");
    console.error("Connection error:", error);
  }
}

// Обработчик отправки сообщения через WebSocket
function sendMessage() {
  const text = messageInput.value.trim();
  if (text && websocket && websocket.readyState === WebSocket.OPEN) {
    // Добавляем сообщение от пользователя
    addMessage(text, true);

    // Отправляем сообщение через WebSocket
    websocket.send(text);

    // Очищаем поле ввода
    messageInput.value = "";
  }
}

// Функция получения геолокации
function getLocation() {
  // Проверяем поддержку геолокации
  if (!navigator.geolocation) {
    addMessage("Геолокация не поддерживается вашим браузером", true);
    return;
  }

  // Блокируем кнопку на время определения
  const originalHTML = locationBtn.innerHTML;
  locationBtn.disabled = true;
  locationBtn.innerHTML = '<span style="font-size: 12px;">Определяем...</span>';

  // Получаем геолокацию
  navigator.geolocation.getCurrentPosition(
    // Успех
    function (position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      // Отправляем данные на сервер
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        const locationData = JSON.stringify({
          type: "location",
          latitude: lat,
          longitude: lon,
          timestamp: new Date().toISOString(),
        });
        websocket.send(locationData);
      }

      // Выводим геолокацию в чат
      addLocation(lat, lon);

      // Восстанавливаем кнопку
      locationBtn.disabled = false;
      locationBtn.innerHTML = originalHTML;
    },
    // Ошибка
    function (error) {
      // Просто восстанавливаем кнопку без сообщения об ошибке
      locationBtn.disabled = false;
      locationBtn.innerHTML = originalHTML;
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function () {
  connectWebSocket();

  // События для отправки сообщения
  sendButton.addEventListener("click", sendMessage);

  messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

  // Событие для кнопки геолокации
  locationBtn.addEventListener("click", getLocation);
});
