import { Knex } from "knex";
import * as bcrypt from 'bcrypt';
import { longText } from "../fixtures";

export async function seed(knex: Knex): Promise<void> {
    await knex("ticket").del();
    await knex("debate").del();
    await knex("assoc_debate_tag").del();
    await knex("user").del();
    await knex("debate_tag").del();
    await knex("argument").del();
    await knex("external_reference").del();

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
        { ticket_id: ticketsIds[0].id, title: "An interesting topic#1", },
        { ticket_id: ticketsIds[1].id, title: "An interesting topic#2", },
        { ticket_id: ticketsIds[2].id, title: "An interesting topic#3", },
        { ticket_id: ticketsIds[3].id, title: "An interesting topic#4", },
        { ticket_id: ticketsIds[4].id, title: "An interesting topic#5", },

        { ticket_id: ticketsIds[5].id, title: "pending topic#1", },
        { ticket_id: ticketsIds[6].id, title: "pending topic#2", },

        { ticket_id: ticketsIds[7].id, title: "in review topic#1", },
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
    const argTickets = await knex("ticket").insert([
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[0].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[1].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[1].id, board_list: 'ACCEPTED' },
        { created_by: user.id, assigned_to: moderators[1].id, board_list: 'PENDING' },
    ], ['id']);

    const args = await knex("argument").insert([
        { debate_id: debateIds[0].id, ticket_id: argTickets[0].id, title: 'Pro#1', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[1].id, title: 'Pro#2', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[2].id, title: 'Pro#3', content: longText, created_by: user.id, type: 'PRO' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[3].id, title: 'Con#1', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[4].id, title: 'Con#2', content: longText, created_by: user.id, type: 'CON' },
        { debate_id: debateIds[0].id, ticket_id: argTickets[5].id, title: 'Con#3', content: longText, created_by: user.id, type: 'CON' },
    ], ['id']);

    await knex("external_reference").insert([
        { argument_id: args[0].id, name: 'foo', url: 'https://andreigatej.dev' },
        { argument_id: args[0].id, name: 'bar', url: 'https://andreigatej.dev' },
        { argument_id: args[1].id, name: 'bar', url: 'https://andreigatej.dev' },
        { argument_id: args[2].id, name: 'bar', url: 'https://andreigatej.dev' },
        { argument_id: args[3].id, name: 'bar', url: 'https://andreigatej.dev' },
        { argument_id: args[4].id, name: 'bar', url: 'https://andreigatej.dev' },
        { argument_id: args[5].id, name: 'bar', url: 'https://andreigatej.dev' },
    ], ['id']);
};

