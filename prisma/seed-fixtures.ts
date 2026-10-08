// The shape of the fake event. Kept apart from seed.ts so the numbers can be
// changed without reading the creation logic.

export const SLUG = "hackday-26";

// Every seeded user gets this domain so a re-run can delete exactly what it
// made — Users are global and the Event cascade does not reach them.
export const DOMAIN = "podium.test";

export const TRACKS = ["AI", "Climate"];

export const CRITERIA = [
  { name: "Impact", weight: 3, maxScore: 5 },
  { name: "Technical depth", weight: 3, maxScore: 5 },
  { name: "Design", weight: 2, maxScore: 5 },
  { name: "Presentation", weight: 1, maxScore: 5 },
];

export const TEAM_COUNT = 12;
export const REGISTRANT_COUNT = 40;
export const SUBMISSION_COUNT = 8;
export const JUDGE_COUNT = 5;
export const JUDGES_PER_SUBMISSION = 3;

export const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 3600 * 1000);

// 40 over 12 teams is 3 each with 4 left over, so the first four take an extra.
export const teamSize = (index: number) =>
  Math.floor(REGISTRANT_COUNT / TEAM_COUNT) +
  (index < REGISTRANT_COUNT % TEAM_COUNT ? 1 : 0);
