#!/usr/bin/env node

/**
 * Comprehensive test execution script for VideoSDK CallKeep integration
 * Runs all test suites and generates detailed reports
 */

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 }
    }
    this.startTime = Date.now()
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = {
      info: '📋',
      success: '✅',
      error: '❌',
      warning: '⚠️',
      performance: '⚡'
    }[type] || '📋'

    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('npx', command.split(' '), {
        stdio: 'pipe',
        shell: true,
        ...options
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      child.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code })
        } else {
          reject({ stdout, stderr, code })
        }
      })
    })
  }

  parseJestResults(output) {
    const lines = output.split('\n')
    let passed = 0
    let failed = 0
    let total = 0

    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed.*?(\d+) failed.*?(\d+) total/)
        if (match) {
          passed = parseInt(match[1]) || 0
          failed = parseInt(match[2]) || 0
          total = parseInt(match[3]) || 0
        }
      }
    }

    return { passed, failed, total }
  }

  async runUnitTests() {
    this.log('Starting Unit Tests...', 'info')
    
    try {
      const result = await this.runCommand('jest testing/unit --coverage --verbose')
      const stats = this.parseJestResults(result.stdout)
      
      this.results.unit = stats
      this.log(`Unit Tests: ${stats.passed}/${stats.total} passed`, 'success')
      
      return true
    } catch (error) {
      const stats = this.parseJestResults(error.stdout || '')
      this.results.unit = stats
      this.log(`Unit Tests Failed: ${stats.failed}/${stats.total} failed`, 'error')
      this.log(error.stderr, 'error')
      
      return false
    }
  }

  async runIntegrationTests() {
    this.log('Starting Integration Tests...', 'info')
    
    try {
      const result = await this.runCommand('jest testing/integration --verbose')
      const stats = this.parseJestResults(result.stdout)
      
      this.results.integration = stats
      this.log(`Integration Tests: ${stats.passed}/${stats.total} passed`, 'success')
      
      return true
    } catch (error) {
      const stats = this.parseJestResults(error.stdout || '')
      this.results.integration = stats
      this.log(`Integration Tests Failed: ${stats.failed}/${stats.total} failed`, 'error')
      this.log(error.stderr, 'error')
      
      return false
    }
  }

  async runPerformanceTests() {
    this.log('Starting Performance Tests...', 'performance')
    
    try {
      const result = await this.runCommand('jest testing/performance --verbose')
      const stats = this.parseJestResults(result.stdout)
      
      this.results.performance = stats
      this.log(`Performance Tests: ${stats.passed}/${stats.total} passed`, 'success')
      
      return true
    } catch (error) {
      const stats = this.parseJestResults(error.stdout || '')
      this.results.performance = stats
      this.log(`Performance Tests Failed: ${stats.failed}/${stats.total} failed`, 'error')
      this.log(error.stderr, 'error')
      
      return false
    }
  }

  async runE2ETests() {
    this.log('Starting E2E Tests...', 'info')
    
    try {
      // Check if Detox is configured
      if (!fs.existsSync('.detoxrc.json')) {
        this.log('Detox not configured, skipping E2E tests', 'warning')
        return true
      }

      const result = await this.runCommand('detox test --configuration ios.sim.debug')
      
      // Parse Detox results (format may vary)
      const stats = { passed: 1, failed: 0, total: 1 } // Simplified for now
      this.results.e2e = stats
      this.log(`E2E Tests: ${stats.passed}/${stats.total} passed`, 'success')
      
      return true
    } catch (error) {
      this.log('E2E Tests Failed', 'error')
      this.log(error.stderr, 'error')
      this.results.e2e = { passed: 0, failed: 1, total: 1 }
      
      return false
    }
  }

  generateReport() {
    const endTime = Date.now()
    const duration = (endTime - this.startTime) / 1000

    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0)
    const totalFailed = Object.values(this.results).reduce((sum, r) => sum + r.failed, 0)
    const totalTests = Object.values(this.results).reduce((sum, r) => sum + r.total, 0)

    const report = {
      summary: {
        totalTests,
        totalPassed,
        totalFailed,
        successRate: totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(2) : 0,
        duration: `${duration.toFixed(2)}s`
      },
      details: this.results,
      timestamp: new Date().toISOString()
    }

    // Save report to file
    const reportPath = path.join(__dirname, '../reports/test-report.json')
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Generate HTML report
    this.generateHTMLReport(report, reportPath.replace('.json', '.html'))

    return report
  }

  generateHTMLReport(report, filePath) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>VideoSDK CallKeep Integration Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        .details { margin-top: 30px; }
        .test-suite { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .progress-bar { width: 100%; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden; }
        .progress-fill { height: 100%; background: #28a745; transition: width 0.3s; }
    </style>
</head>
<body>
    <div class="header">
        <h1>VideoSDK CallKeep Integration Test Report</h1>
        <p>Generated on: ${report.timestamp}</p>
        <p>Duration: ${report.summary.duration}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${report.summary.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold;" class="success">${report.summary.totalPassed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold;" class="error">${report.summary.totalFailed}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div style="font-size: 2em; font-weight: bold;" class="${report.summary.totalFailed === 0 ? 'success' : 'warning'}">${report.summary.successRate}%</div>
        </div>
    </div>

    <div class="details">
        <h2>Test Suite Details</h2>
        ${Object.entries(report.details).map(([suite, results]) => `
            <div class="test-suite">
                <h3>${suite.charAt(0).toUpperCase() + suite.slice(1)} Tests</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${results.total > 0 ? (results.passed / results.total * 100) : 0}%"></div>
                </div>
                <p>${results.passed}/${results.total} passed (${results.failed} failed)</p>
            </div>
        `).join('')}
    </div>
</body>
</html>
    `

    fs.writeFileSync(filePath, html)
  }

  async run() {
    this.log('🚀 Starting VideoSDK CallKeep Integration Test Suite', 'info')
    this.log('=' .repeat(60), 'info')

    const results = []

    // Run all test suites
    results.push(await this.runUnitTests())
    results.push(await this.runIntegrationTests())
    results.push(await this.runPerformanceTests())
    
    // E2E tests are optional (require device setup)
    if (process.argv.includes('--e2e')) {
      results.push(await this.runE2ETests())
    } else {
      this.log('Skipping E2E tests (use --e2e flag to include)', 'warning')
    }

    // Generate report
    const report = this.generateReport()

    // Print summary
    this.log('=' .repeat(60), 'info')
    this.log('📊 Test Summary', 'info')
    this.log(`Total Tests: ${report.summary.totalTests}`, 'info')
    this.log(`Passed: ${report.summary.totalPassed}`, 'success')
    this.log(`Failed: ${report.summary.totalFailed}`, report.summary.totalFailed > 0 ? 'error' : 'info')
    this.log(`Success Rate: ${report.summary.successRate}%`, report.summary.totalFailed === 0 ? 'success' : 'warning')
    this.log(`Duration: ${report.summary.duration}`, 'info')

    // Exit with appropriate code
    const allPassed = results.every(result => result === true)
    process.exit(allPassed ? 0 : 1)
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner()
  runner.run().catch(error => {
    console.error('Test runner failed:', error)
    process.exit(1)
  })
}

module.exports = TestRunner
