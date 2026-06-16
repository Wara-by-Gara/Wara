import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCss } from "./generate-css.ts";

test("css/tokens.css 가 토큰 소스와 동기화되어 있다 (drift 방지)", () => {
  const onDisk = readFileSync(
    new URL("../css/tokens.css", import.meta.url),
    "utf8",
  );
  assert.equal(
    onDisk,
    buildCss(),
    "토큰 소스를 바꾼 뒤 `pnpm -F @wara/tokens generate` 를 실행해 tokens.css 를 재생성하세요.",
  );
});
