import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    await knex("debate_tag").del();

    await knex("debate_tag").insert([
        { id: 1, name: "history" },
        { id: 2, name: "community" },
        { id: 3, name: "health" }
    ]);
};
