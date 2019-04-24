import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import Sval from '../src'

let code

const codePath = resolve(__dirname, '../dist/sval.min.js')
if (existsSync(codePath)) {
  code = readFileSync(codePath, 'utf-8')
} else {
  code = "const msg = 'fisrt build'"
}

describe('testing src/index.ts', () => {
  it('should compile normally', () => {  
    const interpreter = new Sval()
    interpreter.run(code)
  })

  it('should compile normally in generator env', () => {  
    const interpreter = new Sval()
    interpreter.run(`!async function(){${code}}()`)
  })
})
