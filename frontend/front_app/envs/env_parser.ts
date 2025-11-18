// https://gist.github.com/MilosPaunovic/1da784b83466197196b4b0fd6448c0b1

import dotenv from "dotenv";

const files = {
    ...dotenv.config({ path: "envs/.env" }).parsed,
    ...dotenv.config({ path: `envs/.env.${process.env.QUASAR_ENVIRONMENT}` })
        .parsed,
    ...dotenv.config({ path: `envs/.env.private` })
        .parsed,
};


export default function () {
    Object.keys(files).forEach((key) => {
        if (typeof files[key] !== "string") {
            files[key] = JSON.stringify(files[key]);
        }
    });

    return files;
}
