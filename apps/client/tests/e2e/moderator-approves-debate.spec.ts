import { expect, test } from "@playwright/test";

const USER_USERNAME = process.env.E2E_USERNAME ?? "";
const USER_PASSWORD = process.env.E2E_PASSWORD ?? "";
const MODERATOR_USERNAME = process.env.E2E_MODERATOR_USERNAME ?? "";
const MODERATOR_PASSWORD = process.env.E2E_MODERATOR_PASSWORD ?? "";
const API_BASE = process.env.NEXT_PUBLIC_API_SERVER_URL ?? "";

interface ActivityCard {
  ticketId: number;
  ticketTitle: string;
  ticketLabel: "debate" | "argument";
  moderatorId: number | null;
}
interface ActivityBoard {
  boardList: "PENDING" | "IN REVIEW" | "ACCEPTED" | "CANCELED";
  cards: ActivityCard[];
}

let inReviewDebate: ActivityCard;

test.beforeAll(async ({ playwright }) => {
  expect(USER_USERNAME, "E2E_USERNAME must be set").toBeTruthy();
  expect(MODERATOR_USERNAME, "E2E_MODERATOR_USERNAME must be set").toBeTruthy();
  expect(API_BASE, "NEXT_PUBLIC_API_SERVER_URL must be set").toBeTruthy();

  const debateTitle = `E2E approve-debate ${Date.now()}`;

  const userRequest = await playwright.request.newContext();
  const userLoginRes = await userRequest.post(`${API_BASE}/auth/login`, {
    data: { emailOrUsername: USER_USERNAME, password: USER_PASSWORD },
  });
  expect(
    userLoginRes.ok(),
    `user login failed: ${userLoginRes.status()}`,
  ).toBeTruthy();

  const debatesRes = await userRequest.get(`${API_BASE}/debates`);
  expect(
    debatesRes.ok(),
    `listing debates failed: ${debatesRes.status()}`,
  ).toBeTruthy();
  const {
    data: publicDebates,
  }: { data: Array<{ tags: Array<{ id: number; name: string }> }> } =
    await debatesRes.json();
  const historyTag = publicDebates
    .flatMap((d) => d.tags)
    .find((t) => t.name === "history");
  expect(historyTag, 'seeded "history" tag not found').toBeTruthy();

  const createRes = await userRequest.post(`${API_BASE}/debates`, {
    data: { title: debateTitle, tagsIds: [historyTag!.id], createdTags: [] },
  });
  expect(
    createRes.ok(),
    `create debate failed: ${createRes.status()}`,
  ).toBeTruthy();
  await userRequest.dispose();

  const moderatorRequest = await playwright.request.newContext();
  const moderatorLoginRes = await moderatorRequest.post(
    `${API_BASE}/auth/login`,
    {
      data: {
        emailOrUsername: MODERATOR_USERNAME,
        password: MODERATOR_PASSWORD,
      },
    },
  );
  expect(
    moderatorLoginRes.ok(),
    `moderator login failed: ${moderatorLoginRes.status()}`,
  ).toBeTruthy();
  const moderatorId: number = (await moderatorLoginRes.json()).data.id;

  const activityRes = await moderatorRequest.get(
    `${API_BASE}/moderator/activity`,
  );
  expect(activityRes.ok()).toBeTruthy();
  const { data: boards }: { data: ActivityBoard[] } = await activityRes.json();

  const pendingCard = boards
    .flatMap((b) => b.cards)
    .find((c) => c.ticketLabel === "debate" && c.ticketTitle === debateTitle);
  expect(
    pendingCard,
    "freshly created debate not found on activity board",
  ).toBeTruthy();

  const moveRes = await moderatorRequest.patch(
    `${API_BASE}/moderator/activity/ticket/${pendingCard!.ticketId}`,
    { data: { boardList: "IN REVIEW" } },
  );
  expect(
    moveRes.ok(),
    `moving ticket to IN REVIEW failed: ${moveRes.status()}`,
  ).toBeTruthy();
  await moderatorRequest.dispose();

  inReviewDebate = { ...pendingCard!, moderatorId };
});

test("moderator approves an in-review debate and it appears on /debates", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByPlaceholder("Email or username").fill(MODERATOR_USERNAME);
  await page.getByPlaceholder("Password").fill(MODERATOR_PASSWORD);
  await page.getByRole("button", { name: "Submit" }).click();

  await page.waitForURL("**/activity");

  const ticketCard = page
    .getByTestId("activity-card")
    .filter({ hasText: inReviewDebate.ticketTitle });

  await expect(ticketCard).toBeVisible();
  await ticketCard.getByTestId("card-actions-trigger").click();

  const approvalResponse = page.waitForResponse(
    (r) =>
      r
        .url()
        .includes(`/moderator/approve/debate/${inReviewDebate.ticketId}`) &&
      r.request().method() === "PATCH" &&
      r.ok(),
  );
  await page.getByTestId("approve-ticket").click();
  await approvalResponse;

  await page.goto("/debates");
  await expect(
    page
      .getByTestId("debate-card")
      .filter({ hasText: inReviewDebate.ticketTitle }),
  ).toBeVisible();
});
