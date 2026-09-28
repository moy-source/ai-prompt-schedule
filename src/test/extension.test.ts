import * as assert from 'assert';
import { deleteScheduledMessage, isChatGptDesktopProcess, isDesktopAppProcess, parseLocalDateTime, updateScheduledMessage } from '../extension';

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

	test('recognizes the ChatGPT desktop process without matching unrelated windows', () => {
		assert.strictEqual(isChatGptDesktopProcess('ChatGPT'), true);
		assert.strictEqual(isChatGptDesktopProcess('chatgpt'), true);
		assert.strictEqual(isChatGptDesktopProcess('Code'), false);
		assert.strictEqual(isChatGptDesktopProcess('chrome'), false);
	});

	test('recognizes the Codex desktop process independently from other apps', () => {
		assert.strictEqual(isDesktopAppProcess('Codex', 'Codex'), true);
		assert.strictEqual(isDesktopAppProcess('codex', 'Codex'), true);
		assert.strictEqual(isDesktopAppProcess('ChatGPT', 'Codex'), false);
		assert.strictEqual(isDesktopAppProcess('Code', 'Codex'), false);
	});

	test('updates a scheduled message without affecting other items', () => {
		const original: Array<{ id: string; fireAt: number; text: string; provider: 'codex' | 'copilot' | 'claude' }> = [
			{ id: 'a', fireAt: 1_700_000_000_000, text: 'Alpha', provider: 'codex' },
			{ id: 'b', fireAt: 1_700_000_100_000, text: 'Beta', provider: 'copilot' }
		];

		const updated = updateScheduledMessage(original, 'a', {
			text: 'Updated Alpha',
			provider: 'claude',
			fireAt: 1_700_000_200_000
		});

		assert.strictEqual(updated[0].text, 'Updated Alpha');
		assert.strictEqual(updated[0].provider, 'claude');
		assert.strictEqual(updated[0].fireAt, 1_700_000_200_000);
		assert.strictEqual(updated[1].text, 'Beta');
	});

	test('deletes a scheduled message by id', () => {
		const original: Array<{ id: string; fireAt: number; text: string; provider: 'codex' | 'copilot' | 'claude' }> = [
			{ id: 'a', fireAt: 1_700_000_000_000, text: 'Alpha', provider: 'codex' },
			{ id: 'b', fireAt: 1_700_000_100_000, text: 'Beta', provider: 'copilot' }
		];

		const filtered = deleteScheduledMessage(original, 'b');
		assert.deepStrictEqual(filtered.map((item) => item.id), ['a']);
	});
});
