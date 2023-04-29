const dotenv = require('dotenv');
dotenv.config();


module.exports = {
  OPEN_AI_TOKEN: process.env.OPENAI_API_KEY,
  PORT: 8000
};