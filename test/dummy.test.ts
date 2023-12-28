import assert from "node:assert";
import test, { describe } from "node:test";


await describe("Dummy tests", async () =>
{
    await test("dummy", () =>
    {
        assert.ok(true);
    });
});