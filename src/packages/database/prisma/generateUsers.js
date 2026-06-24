// Generates N users for a given org + role. Safe to run repeatedly —
// usernames/emails are checked for collisions before each insert.
// Run with --count/--org/--role flags for non-interactive use, or with no
// flags at all to be walked through it (and to create an org if none exist).
const path = require('path')
const readline = require('readline')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') })

const VALID_ROLES = ['Admin', 'Bocal', 'Student']
const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12
const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || 'Test1234!'

function parseArgs(argv) {
  const args = {}
  for (const arg of argv) {
    const match = arg.match(/^--([^=]+)=?(.*)$/)
    if (match) args[match[1]] = match[2]
  }
  return args
}

async function resolveOrg(orgArg) {
  if (!orgArg) throw new Error('org is required (id, email, or tag)')
  if (/^\d+$/.test(orgArg)) {
    const org = await prisma.organization.findUnique({ where: { id: parseInt(orgArg, 10) } })
    if (!org) throw new Error(`No organization found with id ${orgArg}`)
    return org
  }
  const org = await prisma.organization.findFirst({
    where: { OR: [{ email: orgArg }, { tag: orgArg }, { name: orgArg }] },
  })
  if (!org) throw new Error(`No organization found matching "${orgArg}"`)
  return org
}

async function createOrg({ name, tag, email }) {
  if (!name || !tag || !email) throw new Error('org name, tag and email are all required')
  const existing = await prisma.organization.findFirst({ where: { OR: [{ email }, { tag }, { name }] } })
  if (existing) throw new Error(`An organization already matches that name/tag/email (#${existing.id} ${existing.name})`)
  return prisma.organization.create({ data: { name, tag, email } })
}

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, (answer) => resolve(answer.trim())))
}

async function createOrgInteractive(rl) {
  console.log("\nLet's create one:")
  const name = await ask(rl, '  Org name: ')
  const tag = await ask(rl, '  Org tag (short code, e.g. 42VIE): ')
  const email = await ask(rl, '  Org email: ')
  return createOrg({ name, tag, email })
}

async function resolveOrgInteractive(rl) {
  const orgs = await prisma.organization.findMany({ orderBy: { id: 'asc' } })
  if (orgs.length === 0) {
    console.log('No organizations found.')
    return createOrgInteractive(rl)
  }
  console.log('\nExisting organizations:')
  for (const o of orgs) console.log(`  #${o.id}  ${o.name} (${o.tag})`)
  const answer = await ask(rl, '\nWhich org? (id, email, or tag — or "new" to create one): ')
  if (answer.toLowerCase() === 'new') return createOrgInteractive(rl)
  return resolveOrg(answer)
}

async function runInteractive() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    const countAnswer = await ask(rl, 'How many users would you like to generate? ')
    const count = parseInt(countAnswer, 10)
    if (!Number.isInteger(count) || count <= 0) throw new Error('count must be a positive integer')

    const organization = await resolveOrgInteractive(rl)

    const roleAnswer = await ask(rl, `Role? (${VALID_ROLES.join('/')}) [Student]: `)
    const role = roleAnswer || 'Student'

    return generateUsers({ count, org: String(organization.id), role })
  } finally {
    rl.close()
  }
}

async function uniqueUsername(base) {
  let username = base
  let counter = 1
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${base}${counter++}`
  }
  return username
}

async function generateUsers({ count, org, role = 'Student' }) {
  if (!Number.isInteger(count) || count <= 0)
    throw new Error('count must be a positive integer')
  if (!VALID_ROLES.includes(role))
    throw new Error(`role must be one of ${VALID_ROLES.join(', ')}`)

  const organization = await resolveOrg(org)
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS)
  const tagSlug = (organization.tag || organization.name).toLowerCase().replace(/[^a-z0-9]/g, '') || 'org'
  const roleSlug = role.toLowerCase()

  const created = []
  for (let i = 1; i <= count; i++) {
    const username = await uniqueUsername(`${tagSlug}${roleSlug}${i}`)
    const email = `${username}@${tagSlug}.generated.local`
    const user = await prisma.user.create({
      data: {
        email,
        username,
        role,
        orgId: organization.id,
        userAuth: { create: { pass_hash: passwordHash, email_verified: true, provider: 'local' } },
        profile: { create: { bio: `Generated ${role} for ${organization.name}.`, last_update: new Date() } },
      },
    })
    created.push(user)
  }

  return { organization, created, password: DEFAULT_PASSWORD }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const interactive = !args.count && !args.org && !args.role

  const { organization, created, password } = interactive
    ? await runInteractive()
    : await generateUsers({ count: parseInt(args.count, 10), org: args.org, role: args.role || 'Student' })

  const role = created[0]?.role ?? 'Student'
  console.log(`\nCreated ${created.length} ${role} user(s) in "${organization.name}" (org #${organization.id}):`)
  for (const u of created) console.log(`  - ${u.username} <${u.email}>`)
  console.log(`\nPassword for all generated users: ${password}`)
}

if (require.main === module) {
  main()
    .catch((err) => {
      console.error('Failed to generate users:', err.message)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}

module.exports = { generateUsers }
