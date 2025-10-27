/**
 * Test script for /api/totalmsg endpoint
 *
 * Usage:
 *   1. Start dev server: npm run dev
 *   2. In another terminal: node test-totalmsg-api.js
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const testAddresses = [
  '0x22D74ADFB45147d7588aFA3ba0eF1c363b7dFcFF',
  '0xde35c097f96c922d35c4a20d6c35ccc96d764ffd',
  '0x2134265d8591154cccfa3553727e1fcf2eb33ac2',
  'invalid', // Test invalid address
  '0x123', // Test incomplete address
]

async function testEndpoint(address) {
  console.log(`\n📝 Testing: ${address}`)
  console.log('─'.repeat(70))

  const startTime = Date.now()

  try {
    const response = await fetch(`${BASE_URL}/api/totalmsg/${address}`)
    const responseTime = Date.now() - startTime
    const data = await response.json()

    console.log(`⏱️  Response Time: ${responseTime}ms`)
    console.log(`📊 Status: ${response.status}`)
    console.log(`✅ Success: ${data.success}`)

    if (data.success) {
      console.log(`📨 Total Messages: ${data.totalMessages}`)
      console.log(`👤 Address: ${data.address}`)
    } else {
      console.log(`❌ Error: ${data.error}`)
    }

    console.log(`\n🔍 Full Response:`)
    console.log(JSON.stringify(data, null, 2))

    return data
  } catch (error) {
    console.log(`❌ Request Failed: ${error.message}`)
    return null
  }
}

async function runTests() {
  console.log('\n🚀 Testing /api/totalmsg Endpoint')
  console.log('═'.repeat(70))
  console.log(`🌐 Base URL: ${BASE_URL}`)
  console.log(`📅 Time: ${new Date().toLocaleString()}`)

  for (const address of testAddresses) {
    await testEndpoint(address)
  }

  console.log('\n✅ All tests completed!')
  console.log('═'.repeat(70))
}

// Run the tests
runTests().catch(error => {
  console.error('Test suite failed:', error)
  process.exit(1)
})
