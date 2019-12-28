function logResponse(response, name = "request") {
  console.log(`Response for ${name}:`, response.data);
}

function logError(error, name = "requeust") {
  console.log(`[ERROR] Response for ${name}:`, error);
}

module.exports = {
  logResponse,
  logError
};
