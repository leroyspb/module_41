      const messagesContainer = document.getElementById('messagesContainer');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');
        const locationBtn = document.getElementById('locationBtn');

        let websocket;

        // Функция для добавления системного сообщения
        function addSystemMessage(text) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message', 'message-system');
            
            const time = new Date();
            const timeString = `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;
            
            messageDiv.innerHTML = `
                ${text}
                <div class="message-time">${timeString}</div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Функция для добавления нового сообщения
        function addMessage(text, isSender = true) {
            const messageDiv = document.createElement('div');
            messageDiv.classList.add('message');
            messageDiv.classList.add(isSender ? 'message-sender' : 'message-server');
            
            const time = new Date();
            const timeString = `${time.getHours()}:${time.getMinutes().toString().padStart(2, '0')}`;
            
            messageDiv.innerHTML = `
                ${text}
                <div class="message-time">${timeString}</div>
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        // Функция подключения к WebSocket
        function connectWebSocket() {
            try {
                websocket = new WebSocket('wss://echo.websocket.org');
                // websocket = new WebSocket('wss://echo-ws-service.herokuapp.com');
                
                
                websocket.onopen = function(event) {
                    statusDot.classList.add('connected');
                    statusText.textContent = 'Подключено';
                    messageInput.placeholder = 'Введите сообщение...';
                    messageInput.disabled = false;
                    sendButton.disabled = false;
                    
                    addSystemMessage('✅ Подключение к эхо-серверу установлено');
                };
                
                websocket.onmessage = function(event) {
                    addMessage(event.data, false);
                };
                
                websocket.onclose = function(event) {
                    statusDot.classList.remove('connected');
                    statusText.textContent = 'Отключено';
                    messageInput.placeholder = 'Переподключение...';
                    messageInput.disabled = true;
                    sendButton.disabled = true;
                    
                    addSystemMessage('❌ Соединение закрыто. Попытка переподключения через 3 секунды...');
                    
                    // Автопереподключение через 3 секунды
                    setTimeout(connectWebSocket, 3000);
                };
                
                websocket.onerror = function(error) {
                    addSystemMessage('❌ Ошибка подключения к WebSocket');
                    console.error('WebSocket error:', error);
                };
                
            } catch (error) {
                addSystemMessage('❌ Ошибка при создании WebSocket соединения');
                console.error('Connection error:', error);
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
                messageInput.value = '';
            }
        }

        // Инициализация при загрузке страницы
        document.addEventListener('DOMContentLoaded', function() {
            connectWebSocket();
            
            // События для отправки сообщения
            sendButton.addEventListener('click', sendMessage);
            
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        });

        