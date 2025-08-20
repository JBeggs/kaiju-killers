#!/usr/bin/env node
/*
  Fix Array() logs to show actual values
  Usage:
    node scripts/fix-array-logs.cjs path/to/console.logs.txt
*/

const fs = require('fs')
const path = require('path')

function main() {
  const fileArg = process.argv[2]
  if (!fileArg) {
    console.error('Usage: node scripts/fix-array-logs.cjs path/to/console.logs.txt')
    process.exit(1)
  }
  const logPath = path.resolve(fileArg)
  if (!fs.existsSync(logPath)) {
    console.error('Log file not found:', logPath)
    process.exit(1)
  }

  const text = fs.readFileSync(logPath, 'utf8')
  const lines = text.split(/\r?\n/)
  
  console.log('===== ARRAY LOGS FOUND =====')
  
  let arrayCount = 0
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.includes('Array(')) {
      arrayCount++
      console.log(`Line ${i + 1}: ${line}`)
      
      // Try to extract the context around Array() to understand what it should be
      const arrayMatch = line.match(/Array\((\d+)\)/)
      if (arrayMatch) {
        const arraySize = arrayMatch[1]
        console.log(`  -> Array size: ${arraySize}`)
        
        // Look for JSON context
        const jsonMatch = line.match(/({.*Array\(\d+\).*})/)
        if (jsonMatch) {
          console.log(`  -> JSON context found, but contains Array() - needs fixing`)
        }
      }
      console.log('')
    }
  }
  
  console.log(`Total Array() logs found: ${arrayCount}`)
  
  if (arrayCount > 0) {
    console.log('\n===== RECOMMENDATIONS =====')
    console.log('1. Arrays in logs should use .map(n => Number(n.toFixed(4))) for positions')
    console.log('2. Arrays in logs should use .join(", ") for string representation')
    console.log('3. Check these specific log statements and fix them to show actual values')
  }
}

if (require.main === module) {
  main()
}
