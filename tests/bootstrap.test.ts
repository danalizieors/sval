import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import Sval from '../src'

let code: string

const codePath = resolve(__dirname, '../dist/sval.min.js')
if (existsSync(codePath)) {
  code = readFileSync(codePath, 'utf-8')
} else {
  code = "const msg = 'fisrt build'"
}

describe('testing src/index.ts', () => {
  it('should compile normally', () => {  
    const interpreter = new Sval()
    interpreter.run(`!async function(){${code}}()`) // also test for generator env
    interpreter.run(code)
  })

  it('should compile normally in generator env', () => {  
    const interpreter = new Sval()
    interpreter.run(`!async function(){${code}}()`)
  })

  it('should support global mode', () => {
    const interpreter = new Sval({
      sandBox: false
    })

    interpreter.run(`
      window.x1 = 5
      this.y1 = 6
    `)

    expect(window.x1).toBe(5)
    expect(window.y1).toBe(6)

    delete window.x1
    delete window.y1
  })

  it('should support sandbox mode', () => {
    const interpreter = new Sval({
      sandBox: true
    })

    interpreter.run(`
      window.x2 = 5
      this.y2 = 6
    `)

    expect(window.x2).toBeUndefined()
    expect(window.y2).toBeUndefined()
  })

  it('should support ecma version 3, 5, 6, 7, 8, 9, 10', () => {
    const versions = [3, 5, 6, 7, 8, 9, 10, 2015, 2016, 2017, 2018, 2019]
    versions.forEach(v => new Sval({ ecmaVer: v}))

    try {
      new Sval({ ecmaVer: 4})
    } catch(ex) {
      expect(ex.message).toBe('unsupported ecmaVer')
    }
  })

  it('should support import module object to engine', () => {
    const bar = 'bar'
    const modules = {
      foo: 'foo',
      bar: function() { return bar } 
    }

    const interpreter = new Sval()
    interpreter.import(modules)

    interpreter.run(`
      exports.foo = foo
      exports.bar = bar()
    `)
    expect(interpreter.exports.foo).toBe('foo')
    expect(interpreter.exports.bar).toBe('bar')

    // append more modules
    interpreter.import('hello', 'world')
    interpreter.import([3,2]) // support array, supported but should be avoided
    interpreter.run(`
      exports.hello = hello
      exports.idx0 = window[0]
    `)
    expect(interpreter.exports.hello).toBe('world')
    expect(interpreter.exports.idx0).toBe(3)

    // override existing modules
    interpreter.import('foo', 'foo2')
    interpreter.run(`
      exports.foo = foo
    `)
    expect(interpreter.exports.foo).toBe('foo2')

    // other than string / object, other types are not supported
    interpreter.import(2)
    interpreter.import(undefined)
    interpreter.import(function() {})
    interpreter.import(true)
    interpreter.import(Symbol('hello'))
  })
})