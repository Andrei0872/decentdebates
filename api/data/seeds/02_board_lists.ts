import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
    await knex("board_list").del();

    await knex("board_list").insert([
        { id: 1, title: "Pending" },
    ]);
};
