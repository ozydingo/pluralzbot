const interactionz = require('interactionz');

const mockRecentDate = {
  toDate: () => new Date()
};

const mockOldDate = {
  toDate: () => new Date(0)
};

test("Repsects a timeout in bugging", () => {
  const buggedAt = mockRecentDate.toDate();
  expect(interactionz.timeToBugAgain(buggedAt)).toBe(false);
})

test("Bugs again", () => {
  const buggedAt = mockOldDate.toDate();
  expect(interactionz.timeToBugAgain(buggedAt)).toBe(true);
})

test("the message decision tree", () => {
  expect(interactionz.messageAction({participation: "ignore"})).toBe("ignore");
  expect(interactionz.messageAction({participation: "autocorrect"})).toBe("reauth");
  expect(interactionz.messageAction({participation: "autocorrect", token: "123"})).toBe("correct");
  expect(interactionz.messageAction({participation: "remind", bugged_at: mockRecentDate})).toBe("wait");
  expect(interactionz.messageAction({participation: "remind", bugged_at: mockOldDate})).toBe("suggest");
  expect(interactionz.messageAction({participation: "remind"})).toBe("suggest");
  expect(interactionz.messageAction({})).toBe("suggest");
})
