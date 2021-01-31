class InvalidTokenError extends Error {}

const VERIFICATION_TOKEN = process.env.VERIFICATION_TOKEN;

function validateToken(token) {
  if (token !== VERIFICATION_TOKEN) {
    throw new InvalidTokenError("Invalid token");
  }
}

module.exports = {
  InvalidTokenError,
  validateToken,
};
