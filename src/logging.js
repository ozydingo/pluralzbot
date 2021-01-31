function logResponse(response, name = "request") {
  console.log(`Response for ${name}: ${JSON.stringify(response.data)}`);
}

function logError(error, name = "requeust") {
  console.log(`[ERROR] Response for ${name}: ${JSON.stringify(error)}`);
}

module.exports = {
  logError,
  logResponse,
};
