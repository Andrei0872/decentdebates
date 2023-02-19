import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    await knex("ticket").del();
    await knex("debate").del();
    await knex("assoc_debate_tag").del();

    const ticketsIds = await knex("ticket").insert([
        { created_by: 1, assigned_to: 2, board_list: 'ACCEPTED' },
        { created_by: 1, assigned_to: 2, board_list: 'ACCEPTED' },
        { created_by: 1, assigned_to: 2, board_list: 'ACCEPTED' },
        { created_by: 1, assigned_to: 2, board_list: 'ACCEPTED' },
        { created_by: 1, assigned_to: 2, board_list: 'ACCEPTED' },

        { created_by: 1, assigned_to: 2, board_list: 'PENDING' },
        { created_by: 1, assigned_to: 2, board_list: 'PENDING' },

        { created_by: 1, assigned_to: 2, board_list: 'IN REVIEW' },
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

    await knex("assoc_debate_tag").insert([
        { debate_id: debateIds[0].id, tag_id: 1 },
        { debate_id: debateIds[0].id, tag_id: 2 },
        { debate_id: debateIds[1].id, tag_id: 1 },
        { debate_id: debateIds[2].id, tag_id: 2 },
        { debate_id: debateIds[2].id, tag_id: 3 },
        { debate_id: debateIds[3].id, tag_id: 3 },
        { debate_id: debateIds[4].id, tag_id: 3 },
        { debate_id: debateIds[5].id, tag_id: 1 },
        { debate_id: debateIds[6].id, tag_id: 2 },
        { debate_id: debateIds[7].id, tag_id: 3 },
    ]);
};

