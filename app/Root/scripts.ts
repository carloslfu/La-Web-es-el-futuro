import { c as _c, Module } from '../wasm-util/ast'
import { BufferedEmitter } from '../wasm-util/emit'

export const c = _c

declare const WebAssembly: any

export function arrayBufferToString (buffer) {
  var arr = new Uint8Array(buffer)
  var str = String.fromCharCode.apply(String, arr)
  if(/[\u0080-\uffff]/.test(str)){
      throw new Error("this string seems to contain (still encoded) multibytes")
  }
  return str
}

export const compileModule = (mod: Module): Promise<any> => {
  const emitter = new BufferedEmitter(new ArrayBuffer(mod.z))
  mod.emit(emitter)
  return WebAssembly.compile(emitter.buffer).then(mod => {
    let m = new WebAssembly.Instance(mod)
    return Promise.resolve(m.exports)
  })
}

export const factorialModule = c.module([
  c.type_section([
    c.func_type([c.i32], c.i32), // type index = 0
  ]),
  c.function_section([
    c.varuint32(0), // function index = 0, using type index 0
  ]),
  c.export_section([
    // exports 'factorial' as function at index 0
    c.export_entry(c.str_ascii('factorial'), c.external_kind.function, c.varuint32(0)),
  ]),
  c.code_section([
    // body of function at index 0:
    c.function_body([ /* additional local variables here */ ], [
      c.if_(c.i32, // i32 = result type of `if` expression
        c.i32.eq(c.get_local(c.i32, 0), c.i32.const(0)), // condition
        [ // then
          c.i32.const(1)
        ],
        [ // else
          c.i32.mul(
            c.get_local(c.i32, 0),
            c.call(c.i32, c.varuint32(0), [ // 0 = function index
              c.i32.sub(c.get_local(c.i32, 0), c.i32.const(1))
            ])
          )
        ]
      )
    ])
  ])
])

export let factorial: { run? (n: number): number } = {}

compileModule(factorialModule).then(ex => {
  factorial.run = ex.factorial
})

export const factorialCode = `c.module([
  c.type_section([
    c.func_type([c.i32], c.i32), // type index = 0
  ]),
  c.function_section([
    c.varuint32(0), // function index = 0, using type index 0
  ]),
  c.export_section([
    // exports 'factorial' as function at index 0
    c.export_entry(c.str_ascii('fn'), c.external_kind.function, c.varuint32(0)),
  ]),
  c.code_section([
    // body of function at index 0:
    c.function_body([ /* additional local variables here */ ], [
      c.if_(c.i32, // i32 = result type of 'if' expression
        c.i32.eq(c.get_local(c.i32, 0), c.i32.const(0)), // condition
        [ // then
          c.i32.const(1)
        ],
        [ // else
          c.i32.mul(
            c.get_local(c.i32, 0),
            c.call(c.i32, c.varuint32(0), [ // 0 = function index
              c.i32.sub(c.get_local(c.i32, 0), c.i32.const(1))
            ])
          )
        ]
      )
    ])
  ])
])
`
