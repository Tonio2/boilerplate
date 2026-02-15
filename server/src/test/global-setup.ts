import { pool } from "@/config/db";

export default function () {
    return async () => {
        await pool.end();
    };
}
