async function respond(req, res) {
  const { body } = req;
  res.status(200).send(body.challenge)
}

module.exports = {
  respond
};
