
module.exports = function parseStringAsArray(arrayAsString) {
  return arrayAsString.split(',').map(itemOfArray => itemOfArray.trim());
}