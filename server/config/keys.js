const prod = require("./prod");
const ci = require("./ci");
const dev  = require("./dev");

let config = null;

if (process.env.NODE_ENV === 'prod') {
  config = prod;
} else if (process.env.NODE_ENV === 'ci') {
  config = ci;
} else {
  config = dev;
}

module.exports = config;
