import Sval from '../src'
import Scope from '../src/scope'

const code = `
  exports.a = 1
  debugger
  exports.b = 2
  debugger
  exports.c = 3
`

describe('testing debug feature', () => {
  it('should ignore debugger statement when running', () => {
    const interpreter = new Sval()
    interpreter.run(code)

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(2)
    expect(interpreter.exports.c).toBe(3)
    expect(interpreter.debugger).toBeNull()
  })

  it('should not resume automatically on debug', () => {
    const interpreter = new Sval()
    interpreter.debug(code)

    expect(interpreter.exports.a).toBeUndefined()
    expect(interpreter.debugger.terminated).toBe(false)
  })

  it('should terminate when debugger statement is missing', () => {
    const code = `
      exports.a = 1
      exports.b = 2
      exports.c = 3
    `

    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()

    expect(interpreter.exports.c).toBe(3)
    expect(interpreter.debugger.terminated).toBe(true)
  })

  it('should stop execution at debugger statement', () => {
    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBeUndefined()
    expect(interpreter.debugger.terminated).toBe(false)
  })

  it('should continue execution after resuming', () => {
    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()
    interpreter.resume()

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(2)
    expect(interpreter.exports.c).toBeUndefined()
    expect(interpreter.debugger.terminated).toBe(false)
  })

  it('should terminate execution after last debugger statement', () => {
    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()
    interpreter.resume()
    interpreter.resume()

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(2)
    expect(interpreter.exports.c).toBe(3)
    expect(interpreter.debugger.terminated).toBe(true)
  })

  it('should create scopes correctly', () => {
    const aScope = new Scope()
    aScope.let('a', 1)
    const bScope = new Scope(aScope)
    bScope.let('b', 2)
    const cScope = new Scope(bScope)
    cScope.let('c', 3)

    expect(aScope.find('a').get()).toBe(1)
    expect(bScope.find('a').get()).toBe(1)
    expect(bScope.find('b').get()).toBe(2)
    expect(cScope.find('a').get()).toBe(1)
    expect(cScope.find('b').get()).toBe(2)
    expect(cScope.find('c').get()).toBe(3)
  })

  it('should create scopes correctly when debugging', () => {
    const aScope = new Scope()
    aScope.let('debugger', { replaying: false })
    aScope.let('a', 1)
    const bScope = new Scope(aScope)
    bScope.let('b', 2)
    const cScope = new Scope(bScope)
    cScope.let('c', 3)

    expect(aScope.find('a').get()).toBe(1)
    expect(bScope.find('a').get()).toBe(1)
    expect(bScope.find('b').get()).toBe(2)
    expect(cScope.find('a').get()).toBe(1)
    expect(cScope.find('b').get()).toBe(2)
    expect(cScope.find('c').get()).toBe(3)

    const b2Scope = new Scope(aScope)
    const c2Scope = new Scope(b2Scope)

    expect(b2Scope.find('a').get()).toBe(1)
    expect(b2Scope.find('b')).toBeNull()
    expect(c2Scope.find('a').get()).toBe(1)
    expect(c2Scope.find('b')).toBeNull()
    expect(c2Scope.find('c')).toBeNull()
  })

  it('should replay scopes correctly when debugging', () => {
    const aScope = new Scope()
    aScope.let('debugger', { replaying: false })
    aScope.let('a', 1)
    const bScope = new Scope(aScope)
    bScope.let('b', 2)
    const cScope = new Scope(bScope)
    cScope.let('c', 3)

    expect(aScope.find('a').get()).toBe(1)
    expect(bScope.find('a').get()).toBe(1)
    expect(bScope.find('b').get()).toBe(2)
    expect(cScope.find('a').get()).toBe(1)
    expect(cScope.find('b').get()).toBe(2)
    expect(cScope.find('c').get()).toBe(3)

    aScope.find('debugger').set({ replaying: true })
    const b2Scope = new Scope(aScope)
    const c2Scope = new Scope(b2Scope)

    expect(aScope.find('a').get()).toBe(1)
    expect(b2Scope.find('a').get()).toBe(1)
    expect(b2Scope.find('b').get()).toBe(2)
    expect(c2Scope.find('a').get()).toBe(1)
    expect(c2Scope.find('b').get()).toBe(2)
    expect(c2Scope.find('c').get()).toBe(3)
  })

  it('should preserve program scope', () => {
    const code = `
      debugger
      const a = 1
      debugger
      exports.a = a
      debugger
      exports.b = a
      debugger
    `

    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()
    
    for (let i = 0; i < 4; i++) interpreter.resume()

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(1)
  })

  it('should preserve nested scopes', () => {
    const code = `
      debugger
      const a = 1
      debugger
      exports.a = a
      debugger
      {
        debugger
        const a = 2
        debugger
        exports.b = a
        debugger
        {
          debugger
          const a = 3
          debugger
          exports.c = a
          debugger
          exports.cc = a
          debugger
        }
        debugger
        exports.bb = a
        debugger
      }
      debugger
      exports.aa = a
      debugger
    `

    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()

    for (let i = 0; i < 8; i++) interpreter.resume()

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(2)
    expect(interpreter.exports.c).toBe(3)

    for (let i = 0; i < 6; i++) interpreter.resume()

    expect(interpreter.exports.aa).toBe(1)
    expect(interpreter.exports.bb).toBe(2)
    expect(interpreter.exports.cc).toBe(3)
    expect(interpreter.debugger.terminated).toBe(true)
  })

  it('should increment a variable in while loop', () => {
    const code = `
      let a = 1
      while (true) {
        exports.a = a
        debugger
        a++
      }
    `

    const interpreter = new Sval()
    interpreter.debug(code)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(1)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(2)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(3)
  })

  it('should increment a variable in for loop', () => {
    const code = `
      for (let i = 0; i < 10; i++) {
        exports.a = i
        debugger
      }
    `

    const interpreter = new Sval()
    interpreter.debug(code)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(0)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(1)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(2)
  })

  it('should increment a variable through function', () => {
    const code = `
      let a = 1
      const inc = () => {
        a++
        debugger
      }
      while (true) {
        exports.a = a
        inc()
        debugger
      }
    `

    const interpreter = new Sval()
    interpreter.debug(code)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(1)

    interpreter.resume()
    interpreter.resume()
    expect(interpreter.exports.a).toBe(2)

    interpreter.resume()
    interpreter.resume()
    expect(interpreter.exports.a).toBe(3)
  })

  it('should increment a function parameter', () => {
    const code = `
      function exporter(a) {
        exports.a = a
        debugger
        exports.b = a + 1
      }
      exporter(1)
      debugger
      exporter(11)
    `

    const interpreter = new Sval()
    interpreter.debug(code)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBeUndefined()

    interpreter.resume()
    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(2)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(11)
    expect(interpreter.exports.b).toBe(2)
    
    interpreter.resume()
    expect(interpreter.exports.a).toBe(11)
    expect(interpreter.exports.b).toBe(12)
  })

  it('should increment an arrow function parameter', () => {
    const code = `
      const exporter = (a) => {
        exports.a = a
        debugger
        exports.b = a + 1
      }
      exporter(1)
      debugger
      exporter(11)
    `

    const interpreter = new Sval()
    interpreter.debug(code)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBeUndefined()

    interpreter.resume()
    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(2)

    interpreter.resume()
    expect(interpreter.exports.a).toBe(11)
    expect(interpreter.exports.b).toBe(2)
    
    interpreter.resume()
    expect(interpreter.exports.a).toBe(11)
    expect(interpreter.exports.b).toBe(12)
  })

  it.only('should work when returning a value', () => {
    const code = `
      const f = (a) => {
        debugger
        return a + 1
      }
      exports.a = f(2)
    `

    const interpreter = new Sval()
    interpreter.debug(code)

    interpreter.resume()
    debugger
    interpreter.resume()

    expect(interpreter.exports.a).toBe(3)
  })

  it('should work when returning a function', () => {
    const code = `
      const f = (a) => (b) => {
        debugger
        return a + b
      }
      const f1 = f(1)
      const f2 = f(2)
      debugger
      exports.ab = f1(2)
    `

    const interpreter = new Sval()
    interpreter.debug(code)

    interpreter.resume()
    interpreter.resume()

    expect(interpreter.exports.ab).toBe(3)
  })
})
