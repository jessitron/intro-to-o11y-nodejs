
const opentelemetry = require("@opentelemetry/api");

class BabyCache {
  constructor() {
    this.cache = [];
  }
  get(key) {
    return this.cache[key];
  }
  set(key, value) {
    this.cache[key] = value;
  }
  has(key) {
    return this.cache[key] !== undefined;
  }
  size(key) {
    return Object.keys(this.cache).length;
  }
  clear() {
    this.cache = [];
  }
};

module.exports = BabyCache
