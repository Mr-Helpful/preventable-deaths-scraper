import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs/promises'

/* Argument parsing */

import { program, Argument } from 'commander'

const path = dirname(fileURLToPath(import.meta.url))
const names = await fs.readdir(`${path}/failed_parses`)
const fields = names.map(name => name.split('.')[0])
const field_arg = new Argument(
  '<field>',
  'Field to add corrections to'
).choices(fields)

program
  .description('Add manual corrections to pre-existing corrections')
  .addArgument(field_arg.argRequired())
  .parse()

const field = program.args[0]

/* Command line GUI */

import inquirer from 'inquirer'

const { default: failed } = await import(`./failed_parses/${field}.json`, {
  assert: { type: 'json' }
})

console.log(`- Manual corrections for '${field}' -`)

let decisions = failed.map(text => [text, 'skipped', {}])
let i = 0

for (; i < decisions.length; i++) {
  const [text] = decisions[i]
  const {
    type: [name, action]
  } = await inquirer.prompt({
    type: 'list',
    name: 'type',
    message: `For the text '${text}':`,
    choices: [
      {
        name: 'mark incorrect',
        value: ['incorrect', _ => []]
      },
      { name: 'mark correct', value: ['correct', text => [text]] },
      {
        name: 'correct typos',
        value: [
          'replace',
          async _ => {
            const { replace } = await inquirer.prompt({
              type: 'input',
              name: 'replace',
              message: 'Corrected text:'
            })
            return [replace]
          }
        ]
      },
      {
        name: 'add categories',
        value: [
          'categories',
          async _ => {
            const { categories } = await inquirer.prompt({
              type: 'input',
              name: 'categories',
              message: 'Categories seperated by `|`:'
            })
            return categories.split('|')
          }
        ]
      },
      { name: 'skip', value: ['skipped', _ => []] },
      {
        name: 'back',
        value: ['skipped', _ => ((i -= 2), [])]
      },
      { name: 'quit', value: ['quit', _ => []] }
    ]
  })

  if (name === 'quit') break

  decisions[i] = [text, name, await action(text)]
}

/* Separate decisions into different files */

const skipped = decisions
  .filter(([_1, name, _2]) => name === 'skipped')
  .map(([text, _1, _2]) => text)
const incorrect = decisions
  .filter(([_1, name, _2]) => name === 'incorrect')
  .map(([text, _1, _2]) => text)
const correct = Object.fromEntries([
  ...decisions
    .filter(([_1, name, _2]) => name === 'correct')
    .map(([text, _1, _2]) => [text, text]),
  ...decisions
    .filter(([_1, name, _2]) => name === 'replace')
    .map(([text, _, [replace]]) => [text, replace]),
  ...decisions
    .filter(([_1, name, _2]) => name === 'categories')
    .flatMap(([_1, _2, categories]) =>
      categories.map(category => [category, category])
    )
])

/* Write to files */

await fs.writeFile(
  `${path}/failed_parses/${field}.json`,
  JSON.stringify(skipped, null, 2)
)

const { default: incorrect_fields = [] } = await import(
  `./incorrect_fields/${field}.json`,
  { assert: { type: 'json' } }
).catch(_ => [])
incorrect_fields.push(...incorrect)
await fs.writeFile(
  `${path}/incorrect_fields/${field}.json`,
  JSON.stringify(incorrect_fields, null, 2)
)

const { default: corrections = [] } = await import(
  `./manual_replace/${field}.json`,
  { assert: { type: 'json' } }
).catch(_ => [])
if (Object.keys(correct).length > 0) corrections.push(correct)
await fs.writeFile(
  `${path}/manual_replace/${field}.json`,
  JSON.stringify(corrections, null, 2)
)
