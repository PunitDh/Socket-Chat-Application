const socket = io("http://localhost:7000");
const userSocket = io("http://localhost:7000/user", {
  auth: { token: "Test" },
});

userSocket.on("connect_error", (error) => {
  displayMessage(error);
});

const messageContainer = document.getElementById("message-container");
const form = document.getElementById("form");
const messageInput = document.getElementById("message-input");
messageInput.focus();
const rooomInput = document.getElementById("room-input");
const joinRoomButton = document.getElementById("room-button");

const username = prompt("What is your name?");
displayMessage("You joined");
document.title = username ? username : document.title;

socket.emit("new-user", username);

socket.on("receive-chat-message", ({ username, message }) => {
  displayMessage(`${username}: ${message}`);
});

socket.on("user-connected", (username) => {
  displayMessage(`${username} connected`);
});

socket.on("user-disconnected", (username) => {
  displayMessage(`${username} disconnected`);
});

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  const room = rooomInput.value;

  if (message === "") return;
  socket.emit("send-chat-message", { username, message, room });
  displayMessage(`${username}: ${message}`, true);
  messageInput.value = "";
});

joinRoomButton.addEventListener("click", () => {
  const room = rooomInput.value;
  socket.emit("join-room", { username, room }, (message) => {
    displayMessage(message);
  });
});

function displayMessage(message, senderIsMe = false) {
  const messageElement = document.createElement("div");
  messageElement.textContent = message;
  messageElement.className = senderIsMe ? "sender" : "receiver";
  messageContainer.append(messageElement);
}

let count = 0;

setInterval(() => {
  socket.volatile.emit("ping", ++count);
}, 1000);

document.addEventListener("keydown", (e) => {
  if (e.target.matches("input")) return;
  if (e.key === "c") socket.connect();
  if (e.key === "d") socket.disconnect();
});
