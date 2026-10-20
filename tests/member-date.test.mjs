import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMemberDate } from '../src/utils/memberDate.js';

test('member dates always use IST including UTC day boundaries', () => {
  assert.match(formatMemberDate('2026-10-19T18:45:00.000000Z'), /20 Oct 2026, 12:15 am IST/i);
  assert.match(formatMemberDate('2026-10-20 06:15:00'), /20 Oct 2026, 11:45 am IST/i);
});
test('missing historical timestamps never become today or the epoch', () => {
  for (const value of [null, undefined, '', 'bad-date']) assert.equal(formatMemberDate(value), 'Not recorded');
});
