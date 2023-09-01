const generateMessage = (text, username = "ChatBot") => ({
  text,
  username,
  createdAt: new Date().getTime(),
});

module.exports = {
  generateMessage,
};
