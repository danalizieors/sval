import Sval from '../src'

const code = `
exports.a = 1
debugger
exports.b = 2
`

describe('testing debug feature', () => {
  it('should ignore debugger statement when running', () => {
    const interpreter = new Sval()
    interpreter.run(code)

    expect(interpreter.exports.a).toBe(1)
    expect(interpreter.exports.b).toBe(2)
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
    `

    const interpreter = new Sval()
    interpreter.debug(code)
    interpreter.resume()

    expect(interpreter.exports.b).toBe(2)
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
})
