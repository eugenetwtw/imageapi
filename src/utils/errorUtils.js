/**
 * Create an error object with status code and message
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {Error} Error object with status code
 */
exports.createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};
