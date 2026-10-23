import type { Knex } from "knex";
import * as bcrypt from "bcrypt";
import { longText, notificationText } from "../fixtures";

// Every load-test account (`load-mod-01`, `load-user-00001`, …) shares it.
export const LOAD_TEST_PASSWORD = "load-test-pass";

const MODERATORS = 50;
const USERS = 9_950;
const ACCEPTED_DEBATES = 2_000;
const PENDING_DEBATES = 200;
const IN_REVIEW_DEBATES = 200;
const CANCELED_DEBATES = 100;
const DEBATES =
  ACCEPTED_DEBATES + PENDING_DEBATES + IN_REVIEW_DEBATES + CANCELED_DEBATES;
const TAGS = 50;
// The top 1% of debates get 2,000–3,000 arguments; the rest 10–50.
const HOT_DEBATES = 20;
// Branching factor of each debate's counterargument tree: argument `j` answers
// argument `j / 5`, which keeps the deepest trees around 5 levels.
const ARGUMENT_BRANCHING = 5;
const TICKET_COMMENTS = 50_000;
const SUBSCRIPTIONS_PER_USER = 5;
const NOTIFICATIONS = 1_000_000;
// `GET /notification` returns every row of a user, so these accounts
// (`load-user-00001` … `00010`) belong to failure scenarios, not the baseline.
const HEAVY_NOTIFICATION_USERS = 10;
const NOTIFICATIONS_PER_HEAVY_USER = 8_000;
// Fixed instead of `now()` so every run produces identical rows.
const EPOCH = "timestamp '2025-10-01'";

// Multiplying by a prime coprime with the range spreads consecutive `n` across
// it deterministically, without `random()`.
const SPREAD = 7919;
const regularUser = (n: string) =>
  `${MODERATORS} + 1 + (${n})::bigint * ${SPREAD} % ${USERS}`;
const moderator = (n: string) => `1 + (${n}) % ${MODERATORS}`;

export async function seed(knex: Knex): Promise<void> {
  const passwordHash = await bcrypt.hash(LOAD_TEST_PASSWORD, 10);

  await knex.transaction(async (trx) => {
    await trx.raw(`
      truncate table ticket_comment, argument, assoc_debate_tag, debate_tag,
        assoc_ticket_tag, ticket_tag, user_debate_subscription, debate, ticket,
        suggestion, notification, "user"
      restart identity cascade
    `);

    await trx.raw(
      `
        insert into "user" (id, username, password, email, created_at, role)
        select
          i,
          username,
          ?,
          username || '@example.com',
          ${EPOCH} + i * interval '30 minutes',
          (case when i <= ${MODERATORS} then 'MODERATOR' else 'USER' end)::user_role
        from generate_series(1, ${MODERATORS + USERS}) i
        cross join lateral (
          select case
            when i <= ${MODERATORS} then 'load-mod-' || lpad(i::text, 2, '0')
            else 'load-user-' || lpad((i - ${MODERATORS})::text, 5, '0')
          end as username
        ) n
      `,
      [passwordHash],
    );

    // Debate `d` uses ticket `d`; argument tickets start after `DEBATES`.
    await trx.raw(`
      insert into ticket (id, created_by, assigned_to, board_list)
      select
        d,
        ${regularUser("d")},
        case when d <= ${ACCEPTED_DEBATES} or d > ${ACCEPTED_DEBATES + PENDING_DEBATES}
          then ${moderator("d")}
        end,
        (case
          when d <= ${ACCEPTED_DEBATES} then 'ACCEPTED'
          when d <= ${ACCEPTED_DEBATES + PENDING_DEBATES} then 'PENDING'
          when d <= ${ACCEPTED_DEBATES + PENDING_DEBATES + IN_REVIEW_DEBATES} then 'IN REVIEW'
          else 'CANCELED'
        end)::board_list_type
      from generate_series(1, ${DEBATES}) d
    `);

    await trx.raw(`
      insert into debate (id, ticket_id, title, created_at, modified_at, created_by)
      select
        d,
        d,
        'Load debate #' || d,
        ${EPOCH} + d * interval '2 hours',
        ${EPOCH} + d * interval '2 hours',
        ${regularUser("d")}
      from generate_series(1, ${DEBATES}) d
    `);

    await trx.raw(`
      insert into debate_tag (id, name)
      select t, 'tag-' || lpad(t::text, 2, '0')
      from generate_series(1, ${TAGS}) t
    `);

    // `GET /debates` inner-joins tags: a debate without one isn't listed.
    await trx.raw(`
      insert into assoc_debate_tag (debate_id, tag_id)
      select d, 1 + (d * 7 + k) % ${TAGS}
      from generate_series(1, ${DEBATES}) d
      cross join lateral generate_series(0, d % 4) k
    `);

    // Only leaves (arguments nobody answers) are drafts or still in review, so
    // every accepted argument's parent is accepted too.
    await trx.raw(`
      create temp table load_argument on commit drop as
      select
        id,
        debate_id,
        j,
        case
          when j * ${ARGUMENT_BRANCHING} <= cnt then 'ACCEPTED'
          when id % 20 = 0 then 'DRAFT'
          when id % 33 = 1 then 'IN REVIEW'
          when id % 50 = 2 then 'PENDING'
          else 'ACCEPTED'
        end as status
      from (
        select row_number() over (order by d, j) as id, d as debate_id, j, cnt
        from generate_series(1, ${ACCEPTED_DEBATES}) d
        cross join lateral (
          select case
            when d <= ${HOT_DEBATES} then 2000 + d * 37 % 1000
            else 10 + d * 13 % 41
          end as cnt
        ) c
        cross join lateral generate_series(1, c.cnt) j
      ) a
    `);

    await trx.raw(`
      insert into ticket (id, created_by, assigned_to, board_list)
      select
        ${DEBATES} + id,
        ${regularUser("id")},
        case when status <> 'PENDING' then ${moderator("id")} end,
        status::board_list_type
      from load_argument
      where status <> 'DRAFT'
    `);

    await trx.raw(
      `
        insert into argument (id, debate_id, ticket_id, title, content,
          counterargument_to, created_by, created_at, type, is_draft)
        select
          a.id,
          a.debate_id,
          case when a.status <> 'DRAFT' then ${DEBATES} + a.id end,
          'Load argument #' || a.id,
          ?,
          p.id,
          ${regularUser("a.id")},
          ${EPOCH} + a.debate_id * interval '2 hours' + a.j * interval '10 minutes',
          (case when a.j % 2 = 0 then 'PRO' else 'CON' end)::argument_type,
          a.status = 'DRAFT'
        from load_argument a
        left join load_argument p
          on p.debate_id = a.debate_id and p.j = a.j / ${ARGUMENT_BRANCHING}
      `,
      [longText],
    );

    await trx.raw(
      `
        insert into ticket_comment (ticket_id, content, commenter_id, created_at, modified_at)
        select
          t.id,
          ?,
          case when i % 2 = 0 then t.created_by else coalesce(t.assigned_to, t.created_by) end,
          ${EPOCH} + i * interval '5 minutes',
          ${EPOCH} + i * interval '5 minutes'
        from generate_series(1, ${TICKET_COMMENTS}) i
        join (
          select id, created_by, assigned_to, row_number() over (order by id) as rn
          from ticket
        ) t
          on t.rn = 1 + i::bigint * ${SPREAD} % (select count(*) from ticket)
      `,
      [longText],
    );

    await trx.raw(`
      insert into user_debate_subscription (user_id, debate_id, subscribed_at)
      select u, 1 + (u * 13 + k * 401) % ${ACCEPTED_DEBATES}, ${EPOCH} + u * interval '1 hour'
      from generate_series(${MODERATORS + 1}, ${MODERATORS + USERS}) u
      cross join generate_series(1, ${SUBSCRIPTIONS_PER_USER}) k
    `);

    const heavyNotifications =
      HEAVY_NOTIFICATION_USERS * NOTIFICATIONS_PER_HEAVY_USER;
    await trx.raw(
      `
        insert into notification (title, content, recipient_id, event, is_read)
        select
          (array['New debate proposed', 'New comment on argument', 'New comment on debate'])[1 + i % 3],
          ?,
          case
            when i <= ${heavyNotifications}
              then ${MODERATORS} + 1 + (i - 1) / ${NOTIFICATIONS_PER_HEAVY_USER}
            else ${MODERATORS + HEAVY_NOTIFICATION_USERS} + 1
              + i::bigint * ${SPREAD} % ${USERS - HEAVY_NOTIFICATION_USERS}
          end,
          (case when i % 3 = 1 then 'ARGUMENT' else 'DEBATE' end)::notification_event,
          i % 5 <> 0
        from generate_series(1, ${NOTIFICATIONS}) i
      `,
      [notificationText],
    );

    // Rows above were inserted with explicit ids, which doesn't advance the
    // sequences; the app's next insert would collide with id 1.
    for (const table of [
      '"user"',
      "ticket",
      "debate",
      "debate_tag",
      "argument",
    ]) {
      await trx.raw(
        `select setval(pg_get_serial_sequence(?, 'id'), (select max(id) from ${table}))`,
        [table],
      );
    }
  });

  // Outside the transaction: VACUUM can't run inside one. See docs/TIL.md.
  await knex.raw("vacuum (analyze)");
}
