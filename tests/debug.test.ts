import Sval from '../src'

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

  it('should preserve program scope', () => {
    const code = `
      const a = 1
      exports.a = a
      debugger
      exports.b = a
    `

    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()
    interpreter.resume()

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(1)
  })

  it.skip('should preserve any scope', () => {
    const code = `
      {
        const a = 1
        exports.a = a
        debugger
        exports.b = a
      }
    `

    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()
    interpreter.resume()

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(1)
  })

  it('should increment a variable', () => {
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


  it('should increment a parameter', () => {
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
})
