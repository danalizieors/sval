import * as estree from 'estree'
import Scope from '../scope'

import { hoist } from './helper'
import evaluate from '.'

export function* Program(program: estree.Program, scope: Scope) {
  if (!scope.hoisted) yield* hoist(program, scope)
  scope.hoisted = true

  for (let i = 0; i < program.body.length; i++) {
    yield* evaluate(program.body[i], scope)
  }
}
