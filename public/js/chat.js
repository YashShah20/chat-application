const socket = io();
const form = document.querySelector("form");
const sidebar = document.querySelector("#sidebar");
const messages = document.querySelector("#messages");
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

const autoscroll = () => {
  // get last message
  const lastMessage = messages.lastElementChild;

  // get bottom margin of last message
  const lastMessageStyles = getComputedStyle(lastMessage);
  const marginBottom = parseInt(lastMessageStyles.marginBottom);

  // height of last message
  const lastMessageHeight = lastMessage.offsetHeight + marginBottom;

  // visible height of last message
  const visibleHeight = messages.offsetHeight;

  const scrollOffset = visibleHeight + messages.scrollTop;

  // container scroll height
  const containerHeight = messages.scrollHeight;

  if (containerHeight - lastMessageHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

// share location
document.querySelector("#share-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    window.alert("Geolocation not supported by the browser");
    return;
  }

  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit("shareLocation", {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  });
});

const handleSubmit = (event) => {
  event.preventDefault();

  event.target.elements.send.setAttribute("disabled", "disabled");
  const message = event.target.elements.message.value;

  // console.log(`SEND: ${message}`);
  socket.emit("send", message, () => {
    event.target.elements.send.removeAttribute("disabled");
    event.target.elements.message.value = "";
    event.target.elements.message.focus();
  });
};

socket.on("message", (message) => {
  // console.log(message);
  const html = Mustache.render(messageTemplate, {
    message: message.text,
    username: message.username,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("location", (location) => {
  // console.log(`LOCATION: ${location}`);
  const html = Mustache.render(locationTemplate, {
    message: location.text,
    username: location.username,
    createdAt: moment(location.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    window.alert(error);
    location.href = "/";
  }
});

socket.on("userListUpdated", ({ room, userList }) => {
  console.log(room, userList);

  const html = Mustache.render(sidebarTemplate, { room, userList });
  sidebar.innerHTML = html;
});

form.addEventListener("submit", handleSubmit);
