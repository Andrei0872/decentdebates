import { Knex } from "knex";
import * as bcrypt from 'bcrypt';
import { longText, notificationText } from "../fixtures";

export async function seed(knex: Knex): Promise<void> {
    await knex("ticket").del();
    await knex("debate").del();
    await knex("assoc_debate_tag").del();
    await knex("user").del();
    await knex("debate_tag").del();
    await knex("argument").del();
    await knex("ticket_comment").del();
    await knex("notification").del();

    const [user, ...moderators] = await knex("user").insert([
        {
            username: "foo.bar",
            password: await bcrypt.hash('pas123', 10),
            email: 'foo@bar.com',
            role: 'USER',
        },
        {
            username: "mod.bar",
            password: await bcrypt.hash('pas123', 10),
            email: 'mod@bar.com',
            role: 'MODERATOR',
        },
        {
            username: "mod.beer",
            password: await bcrypt.hash('pas123', 10),
            email: 'mod@beer.com',
            role: 'MODERATOR',
        },
    ], ['id']);

    const ticketsIds = await knex("ticket").insert([
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },

        { created_by: user.id, assigned_to: moderators[1].id, board_list: 'IN REVIEW' },
        { created_by: user.id, assigned_to: moderators[1].id, board_list: 'IN REVIEW' },

        { created_by: user.id, assigned_to: null, board_list: 'PENDING' },
        { created_by: user.id, assigned_to: null, board_list: 'PENDING' },

        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'IN REVIEW' },
    ], ['id']);

    const debateIds = await knex("debate").insert([
        { ticket_id: ticketsIds[0].id, title: "An interesting topic#1", created_by: user.id },
        { ticket_id: ticketsIds[1].id, title: "An interesting topic#2", created_by: user.id },
        { ticket_id: ticketsIds[2].id, title: "An interesting topic#3", created_by: user.id },
        { ticket_id: ticketsIds[3].id, title: "An interesting topic#4", created_by: user.id },
        { ticket_id: ticketsIds[4].id, title: "An interesting topic#5", created_by: user.id },

        { ticket_id: ticketsIds[5].id, title: "pending topic#1", created_by: user.id },
        { ticket_id: ticketsIds[6].id, title: "pending topic#2", created_by: user.id },

        { ticket_id: ticketsIds[7].id, title: "in review topic#1", created_by: user.id },
    ], ['id']);

    const tags = await knex("debate_tag").insert([
        { name: "history" },
        { name: "community" },
        { name: "health" }
    ], ['id']);

    await knex("assoc_debate_tag").insert([
        { debate_id: debateIds[0].id, tag_id: tags[0].id },
        { debate_id: debateIds[0].id, tag_id: tags[1].id },
        { debate_id: debateIds[1].id, tag_id: tags[0].id },
        { debate_id: debateIds[2].id, tag_id: tags[1].id },
        { debate_id: debateIds[2].id, tag_id: tags[2].id },
        { debate_id: debateIds[3].id, tag_id: tags[2].id },
        { debate_id: debateIds[4].id, tag_id: tags[2].id },
        { debate_id: debateIds[5].id, tag_id: tags[0].id },
        { debate_id: debateIds[6].id, tag_id: tags[1].id },
        { debate_id: debateIds[7].id, tag_id: tags[2].id },
    ]);

    // ===== ARGUMENTS =====
    let argTickets = await knex("ticket").insert([
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[1].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[1].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[1].id, board_list: 'IN REVIEW' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'IN REVIEW' },
    ], ['id']);

    await knex("argument").insert([
        { debate_id: debateIds[0].id, ticket_id: argTickets[0].id, title: 'Pro#1', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[1].id, title: 'Pro#2', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[2].id, title: 'Pro#3', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[3].id, title: 'Con#1', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[4].id, title: 'Con#2', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[5].id, title: 'Con#3', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[6].id, title: 'Con#4', content: longText, created_by: user.id, type: 'CON' },
    ], ['id']);

    // ===== ARGUMENTS & COUNTERARGUMENTS =====

    argTickets = await knex("ticket").insert([
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
    ], ['id']);

    /*
        1: PRO

        1 -> { 2, 3, 4 }
        2 -> { 5, 6 }
        3 -> { 7 }
        4 -> { 8, 9 }
        8 -> { 10, 11, 12 }
        10 -> { 13 }
    */
    const args = await knex("argument").insert([
        { debate_id: debateIds[1].id, ticket_id: argTickets[0].id, title: 'Pro#1', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[1].id, title: 'Con#1', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[2].id, title: 'Con#2', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[3].id, title: 'Con#3', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[4].id, title: 'Pro#2', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[5].id, title: 'Pro#3', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[6].id, title: 'Pro#4', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[7].id, title: 'Pro#5', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[8].id, title: 'Pro#6', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[9].id, title: 'Con#4', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[10].id, title: 'Con#5', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[11].id, title: 'Con#6', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[1].id, ticket_id: argTickets[12].id, title: 'Pro#7', content: longText, created_by: user.id, type: 'PRO' },
    ], ['id']);

    await Promise.all([
        knex("argument")
            .whereIn('id', [args[1].id, args[2].id, args[3].id])
            .update({ counterargument_to: args[0].id }),

        knex("argument")
            .whereIn('id', [args[4].id, args[5].id])
            .update({ counterargument_to: args[1].id }),

        knex("argument")
            .whereIn('id', [args[6].id])
            .update({ counterargument_to: args[2].id }),

        knex("argument")
            .whereIn('id', [args[7].id, args[8].id])
            .update({ counterargument_to: args[3].id }),

        knex("argument")
            .whereIn('id', [args[9].id, args[10].id, args[11].id])
            .update({ counterargument_to: args[7].id }),

        knex("argument")
            .whereIn('id', [args[12].id])
            .update({ counterargument_to: args[9].id }),
    ]);

    // ===== DEBATE COMMENTS =====
    await knex("ticket_comment").insert([
        { ticket_id: ticketsIds[7].id, content: longText, commenter_id: user.id },
        { ticket_id: ticketsIds[7].id, content: longText, commenter_id: user.id },
        { ticket_id: ticketsIds[7].id, content: longText, commenter_id: moderators[0].id },
        { ticket_id: ticketsIds[7].id, content: longText, commenter_id: moderators[0].id },
    ]);

    // ===== NOTIFICATIONS =====
    await knex("notification").insert([
        { title: 'New debate proposed', content: notificationText, recipient_id: user.id, event: 'DEBATE', is_read: false, },
        { title: 'New comment on argument', content: notificationText, recipient_id: user.id, event: 'ARGUMENT', is_read: false, },
        { title: 'New comment on debate', content: notificationText, recipient_id: user.id, event: 'DEBATE', is_read: true, },
    ]);
};