import assert from 'node:assert'
import { getQuotaForPlan, resetCountsData, shouldResetDaily } from '@/lib/subscription'

function testQuotaSupporter() {
  assert.strictEqual(getQuotaForPlan('SUPPORTER', 'regen'), 15)
  assert.strictEqual(getQuotaForPlan('SUPPORTER', 'download'), 15)
  assert.strictEqual(getQuotaForPlan('SUPPORTER', 'cl'), 50)
  assert.strictEqual(getQuotaForPlan('SUPPORTER', 'analysis'), 15)
}

function testQuotaUltimate() {
  assert.strictEqual(getQuotaForPlan('ULTIMATE', 'regen'), null)
}

function testResetDaily() {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const now = new Date()
  assert.strictEqual(shouldResetDaily(yesterday, now), true)
  assert.strictEqual(shouldResetDaily(now, now), false)
}

function testResetCounts() {
  const data = resetCountsData(new Date('2026-01-19T00:00:00Z'))
  assert.strictEqual(data.regenCount, 0)
  assert.strictEqual(data.downloadCount, 0)
  assert.strictEqual(data.clCount, 0)
  assert.strictEqual(data.analysisCount, 0)
  assert.strictEqual(data.uploadCount, 0)
}

function run() {
  testQuotaSupporter()
  testQuotaUltimate()
  testResetDaily()
  testResetCounts()
  console.log('Subscription helper tests passed.')
}

run()
