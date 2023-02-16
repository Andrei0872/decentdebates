import { Knex } from "knex";
import * as bcrypt from 'bcrypt';

export async function seed(knex: Knex): Promise<void> {
    await knex("user").del();

    await knex("user").insert([
        {
            id: 1,
            username: "foo.bar",
            password: await bcrypt.hash('pas123', 10),
            email: 'foo@bar.com',
            role: 'USER',
        },
        {
            id: 2,
            username: "mod.bar",
            password: await bcrypt.hash('pas123', 10),
            email: 'mod@bar.com',
            role: 'MODERATOR',
        },
    ]);
};
