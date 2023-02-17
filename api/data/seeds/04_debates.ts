import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    await knex("ticket").del();
    await knex("debate").del();

    await knex("ticket").insert([
        { id: 1, created_by: 1, assigned_to: 2, list_id: 1 },
        { id: 2, created_by: 1, assigned_to: 2, list_id: 1 },
        { id: 3, created_by: 1, assigned_to: 2, list_id: 1 },
        { id: 4, created_by: 1, assigned_to: 2, list_id: 1 },
        { id: 5, created_by: 1, assigned_to: 2, list_id: 1 },
    ]);

    await knex("debate").insert([
        { id: 1, ticket_id: 1, title: "An interesting topic#1", },
        { id: 2, ticket_id: 2, title: "An interesting topic#2", },
        { id: 3, ticket_id: 3, title: "An interesting topic#3", },
        { id: 4, ticket_id: 4, title: "An interesting topic#4", },
        { id: 5, ticket_id: 5, title: "An interesting topic#5", },
    ]);

    await knex("assoc_debate_tag").insert([
        { debate_id: 1, tag_id: 1 },
        { debate_id: 1, tag_id: 2 },
        { debate_id: 2, tag_id: 1 },
        { debate_id: 3, tag_id: 2 },
        { debate_id: 3, tag_id: 3 },
        { debate_id: 4, tag_id: 3 },
        { debate_id: 5, tag_id: 3 },
    ]);
};
