import { fileURLToPath } from 'url'
import { dirname } from 'path'
import fs from 'fs/promises'

import { program, Argument } from 'commander'

const path = dirname(fileURLToPath(import.meta.url))
const names = await fs.readdir(`${path}/failed_parses`)
const fields = names.map(name => name.split('.')[0])
console.log(fields)
const field_arg = new Argument('field', 'Field to add corrections to').choices(
  fields
)

const { field } = program
  .description('Add manual corrections to pre-existing corrections')
  .addArgument(field_arg.argRequired())
  .parse()
