import * as assert from 'assert';
import { parseLocalDateTime } from '../extension';

suite('Extension Test Suite', () => {
	test('parses a valid local date and time', () => {
		const date = parseLocalDateTime('2026-09-28 14:30');
		assert.ok(date);
		assert.strictEqual(date.getFullYear(), 2026);
		assert.strictEqual(date.getMonth(), 8);
		assert.strictEqual(date.getDate(), 28);
		assert.strictEqual(date.getHours(), 14);
		assert.strictEqual(date.getMinutes(), 30);
	});

	test('rejects invalid date and time values', () => {
		assert.strictEqual(parseLocalDateTime('2026-02-30 14:30'), undefined);
		assert.strictEqual(parseLocalDateTime('2026-09-28 25:30'), undefined);
		assert.strictEqual(parseLocalDateTime('28-09-2026 14:30'), undefined);
	});
});
