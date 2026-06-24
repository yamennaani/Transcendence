const path = require('path')
const bcrypt = require('bcrypt')
const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const groupLetter = (index) => `group${String.fromCharCode(65 + index)}`

async function clearDatabase() {
  await prisma.evalSectionScore.deleteMany()
  await prisma.evalAssignment.deleteMany()
  await prisma.evalResponse.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.file.deleteMany()
  await prisma.groupInvite.deleteMany()
  await prisma.groupMember.deleteMany()
  await prisma.group.deleteMany()
  await prisma.evalSection.deleteMany()
  await prisma.evalSheet.deleteMany()
  await prisma.assignment.deleteMany()
  await prisma.enrollment.deleteMany()
  await prisma.class.deleteMany()
  await prisma.userProfile.deleteMany()
  await prisma.userAuth.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()
  await prisma.orgProfile.deleteMany()
  await prisma.organization.deleteMany()
}

async function createUser({ email, username, role, orgId, bio, passwordHash }) {
  return prisma.user.create({
    data: {
      email,
      username,
      role,
      orgId,
      userAuth: {
        create: {
          pass_hash: passwordHash,
          email_verified: true,
          provider: 'local'
        }
      },
      profile: {
        create: {
          bio,
          last_update: new Date()
        }
      }
    }
  })
}

// async function createUser({ email, username, role, orgId, bio }) {
//   return prisma.user.create({
//   const passwordHash = 'fake-hashed-password-for-dev'

//   const org1 = await prisma.organization.create({
//     data: {
//       email,
//       username,
//       role,
//       orgId,
//       userAuth: {
//         create: { pass_hash: passwordHash }
//       },
//       profile: {
//         create: {
//           bio,
//           last_update: new Date()
//         }
//       }
//     }
//   })
// }

async function createEvalSheet(assignmentId, sections) {
  return prisma.evalSheet.create({
    data: {
      assId: assignmentId,
      sections: {
        create: sections
      }
    },
    include: {
      sections: true
    }
  })
}

async function enrollUsers(users, classId) {
  for (const user of users) {
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        classId,
        status: 'Active'
      }
    })
  }
}

async function createGroupsForAssignment({ assignmentId, users, groupSize, nameMode }) {
  const groups = []

  for (let i = 0; i < users.length; i += groupSize) {
    const members = users.slice(i, i + groupSize)
    if (members.length === 0) continue

    const groupIndex = groups.length
    const groupName =
      nameMode === 'letters'
        ? groupLetter(groupIndex)
        : `group${groupIndex + 1}`

    const group = await prisma.group.create({
      data: {
        assId: assignmentId,
        name: groupName,
        size: members.length,
        leaderId: members[0].id,
        members: {
          create: members.map((user) => ({ userId: user.id }))
        }
      },
      include: {
        members: true
      }
    })

    groups.push(group)
  }

  return groups
}

async function createSubmissionForGroup({ group, uploader, fileName, mimeType, url, finalScore = null, passed = null }) {
  const file = await prisma.file.create({
    data: {
      name: fileName,
      mimiType: mimeType,
      size: 123456,
      url,
      uploadedBy: uploader.id
    }
  })

  const submission = await prisma.submission.create({
    data: {
      groupId: group.id,
      fileId: file.id,
      status: 'Open',
      type: mimeType.includes('pdf') ? 'PDF' : 'FILE',
      finalScore,
      passed
    }
  })

  return { file, submission }
}

async function main() {
  //console.log('Seeding database...')

  const SEED_PASSWORD = 'Test1234!'
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12)
  

  await clearDatabase()

  const org42 = await prisma.organization.create({
    data: {
      email: 'contact@42vienna.example',
      name: '42 Vienna',
      tag: '42VIE',
      profile: {
        create: {
          bio: 'Peer-learning coding school in Vienna.',
          tel_num: '+431424242'
        }
      }
    }
  })

  const orgWU = await prisma.organization.create({
    data: {
      email: 'office@wu-vienna.example',
      name: 'WU Vienna',
      tag: 'WU',
      profile: {
        create: {
          bio: 'Example university organization for economics courses.',
          tel_num: '+431313360'
        }
      }
    }
  })

  const admin42 = await createUser({
    email: 'admin42@example.com',
    username: 'admin',
    role: 'Admin',
    orgId: org42.id,
    bio: '42 Vienna admin account.',
    passwordHash
  })

  const bocal42 = await createUser({
    email: 'bocal42@example.com',
    username: 'bocal',
    role: 'Bocal',
    orgId: org42.id,
    bio: '42 Vienna bocal account.',
    passwordHash
  })

  const adminWU = await createUser({
    email: 'uni.admin@example.com',
    username: 'Uni admin',
    role: 'Admin',
    orgId: orgWU.id,
    bio: 'WU Vienna admin account.',
    passwordHash
  })

  const profWU = await createUser({
    email: 'uni.prof@example.com',
    username: 'Uni Prof',
    role: 'Bocal',
    orgId: orgWU.id,
    bio: 'WU Vienna professor account.',
    passwordHash
  })

  const students42 = []
  const studentsWU = []

  for (let i = 1; i <= 20; i++) {
    students42.push(await createUser({
      email: `42student${i}@example.com`,
      username: `42student${i}`,
      role: 'Student',
      orgId: org42.id,
      bio: `I am 42 Vienna student ${i}.`,
      passwordHash
    }))
  }

  for (let i = 1; i <= 20; i++) {
    studentsWU.push(await createUser({
      email: `unistudent${i}@example.com`,
      username: `UniStudent${i}`,
      role: 'Student',
      orgId: orgWU.id,
      bio: `I am WU Vienna student ${i}.`,
      passwordHash
    }))
  }

  const minishell = await prisma.class.create({
    data: {
      name: 'Minishell',
      description: 'Unix shell project with parsing, execution and process control.',
      created_by: bocal42.id,
      org_id: org42.id,
      pass_threshold: 60
    }
  })

  const ftTranscendence = await prisma.class.create({
    data: {
      name: 'ft_transcendence',
      description: 'Full-stack web application with auth, real-time features and services.',
      created_by: bocal42.id,
      org_id: org42.id,
      pass_threshold: 70
    }
  })

  const macroMethods = await prisma.class.create({
    data: {
      name: 'Macroeconomic Models and Methods',
      description: 'Core models and computational methods in macroeconomics.',
      created_by: profWU.id,
      org_id: orgWU.id,
      pass_threshold: 50
    }
  })

  const advancedMacro = await prisma.class.create({
    data: {
      name: 'Advanced Macroeconomics II',
      description: 'Advanced macroeconomic theory, policy and numerical applications.',
      created_by: profWU.id,
      org_id: orgWU.id,
      pass_threshold: 50
    }
  })

  await enrollUsers(students42.slice(0, 10), minishell.id)
  await enrollUsers(students42.slice(10, 20), ftTranscendence.id)
  await enrollUsers(studentsWU, macroMethods.id)
  await enrollUsers(studentsWU, advancedMacro.id)

  const assignment1 = await prisma.assignment.create({
    data: {
      classid: minishell.id,
      name: 'Mini Shell Exercise',
      description: 'Submit a simple shell-like parser.',
      groupSize: 2,
      req_eval: 3,
      max_score: 100,
      pass_threshold: 60,
      requiresStaffReview: false,
      subtype: 'FILE'
    }
  })

  const assignment2 = await prisma.assignment.create({
    data: {
      classid: ftTranscendence.id,
      name: 'Web Application',
      description: 'Submit a working web application milestone for ft_transcendence.',
      groupSize: 2,
      req_eval: 3,
      max_score: 100,
      pass_threshold: 70,
      requiresStaffReview: true,
      subtype: 'FILE'
    }
  })

  const assignment3 = await prisma.assignment.create({
    data: {
      classid: macroMethods.id,
      name: 'Peer Assignment: fiscal policy in a NK model',
      description: 'Analyze fiscal policy shocks in a New Keynesian model.',
      groupSize: 1,
      req_eval: 2,
      max_score: 100,
      pass_threshold: 50,
      requiresStaffReview: false,
      subtype: 'PDF'
    }
  })

  const assignment4 = await prisma.assignment.create({
    data: {
      classid: advancedMacro.id,
      name: 'Peer Assignment: energy price shocks in a NK model',
      description: 'Evaluate macroeconomic effects of energy price shocks in a New Keynesian model.',
      groupSize: 1,
      req_eval: 2,
      max_score: 100,
      pass_threshold: 50,
      requiresStaffReview: false,
      subtype: 'PDF'
    }
  })

  const evalSheet1 = await createEvalSheet(assignment1.id, [
    { name: 'Correctness', description: 'Does the submission work?', marks: 50, sectionType: 'Slider' },
    { name: 'Code Style', description: 'Is the code readable?', marks: 30, sectionType: 'Slider' },
    { name: 'Defense', description: 'Did the student explain the work?', marks: 20, sectionType: 'Toggle' }
  ])

  await createEvalSheet(assignment2.id, [
    { name: 'Backend API', description: 'Are core backend endpoints implemented correctly?', marks: 35, sectionType: 'Slider' },
    { name: 'Frontend Integration', description: 'Does the frontend communicate correctly with services?', marks: 30, sectionType: 'Slider' },
    { name: 'Security', description: 'Are authentication and validation handled responsibly?', marks: 20, sectionType: 'Slider' },
    { name: 'Project Structure', description: 'Is the codebase organized and maintainable?', marks: 15, sectionType: 'Slider' }
  ])

  const evalSheet3 = await createEvalSheet(assignment3.id, [
    { name: 'Model Setup', description: 'Is the NK model specified clearly?', marks: 25, sectionType: 'Slider' },
    { name: 'Fiscal Shock Analysis', description: 'Is the policy experiment implemented and interpreted correctly?', marks: 35, sectionType: 'Slider' },
    { name: 'Economic Interpretation', description: 'Are mechanisms explained clearly?', marks: 25, sectionType: 'Slider' },
    { name: 'Presentation', description: 'Is the PDF concise and well structured?', marks: 15, sectionType: 'Slider' }
  ])

  await createEvalSheet(assignment4.id, [
    { name: 'Shock Design', description: 'Is the energy price shock modeled appropriately?', marks: 25, sectionType: 'Slider' },
    { name: 'Quantitative Results', description: 'Are results presented clearly and accurately?', marks: 30, sectionType: 'Slider' },
    { name: 'Policy Discussion', description: 'Does the submission discuss implications convincingly?', marks: 30, sectionType: 'Slider' },
    { name: 'Writing Quality', description: 'Is the write-up coherent and professional?', marks: 15, sectionType: 'Slider' }
  ])

  const minishellGroups = await createGroupsForAssignment({
    assignmentId: assignment1.id,
    users: students42.slice(0, 10),
    groupSize: 2,
    nameMode: 'letters'
  })

  const transcendenceGroups = await createGroupsForAssignment({
    assignmentId: assignment2.id,
    users: students42.slice(10, 20),
    groupSize: 2,
    nameMode: 'letters'
  })

  const macroGroups = await createGroupsForAssignment({
    assignmentId: assignment3.id,
    users: studentsWU,
    groupSize: 1,
    nameMode: 'numbers'
  })

  const advancedMacroGroups = await createGroupsForAssignment({
    assignmentId: assignment4.id,
    users: studentsWU,
    groupSize: 1,
    nameMode: 'numbers'
  })

  await prisma.groupInvite.create({
    data: {
      senderId: students42[0].id,
      reciverId: students42[4].id,
      targetGroupId: minishellGroups[0].id,
      status: 'Pending'
    }
  })

  await prisma.groupInvite.create({
    data: {
      senderId: students42[10].id,
      reciverId: students42[14].id,
      targetGroupId: transcendenceGroups[0].id,
      status: 'Accepted'
    }
  })

  await prisma.groupInvite.create({
    data: {
      senderId: studentsWU[0].id,
      reciverId: studentsWU[1].id,
      targetGroupId: macroGroups[0].id,
      status: 'Rejected'
    }
  })

  const { submission: submission1 } = await createSubmissionForGroup({
    group: minishellGroups[0],
    uploader: students42[0],
    fileName: 'minishell-groupA.zip',
    mimeType: 'application/zip',
    url: '/uploads/minishell-groupA.zip',
    finalScore: 82,
    passed: true
  })

  const { submission: submission2 } = await createSubmissionForGroup({
    group: minishellGroups[1],
    uploader: students42[2],
    fileName: 'minishell-groupB.zip',
    mimeType: 'application/zip',
    url: '/uploads/minishell-groupB.zip',
    finalScore: 58,
    passed: false
  })

  const { submission: submission3 } = await createSubmissionForGroup({
    group: transcendenceGroups[0],
    uploader: students42[10],
    fileName: 'webapp-groupA.zip',
    mimeType: 'application/zip',
    url: '/uploads/webapp-groupA.zip',
    finalScore: null,
    passed: null
  })

  const { submission: submission4 } = await createSubmissionForGroup({
    group: macroGroups[0],
    uploader: studentsWU[0],
    fileName: 'fiscal-policy-group1.pdf',
    mimeType: 'application/pdf',
    url: '/uploads/fiscal-policy-group1.pdf',
    finalScore: 88,
    passed: true
  })

  const { submission: submission5 } = await createSubmissionForGroup({
    group: macroGroups[1],
    uploader: studentsWU[1],
    fileName: 'fiscal-policy-group2.pdf',
    mimeType: 'application/pdf',
    url: '/uploads/fiscal-policy-group2.pdf',
    finalScore: null,
    passed: null
  })

  const response1 = await prisma.evalResponse.create({
    data: {
      subId: submission1.id,
      userId: students42[4].id,
      givenMarks: 85,
      comment: 'Good work overall. Parser behavior is mostly correct.',
      rating: 4
    }
  })

  const response2 = await prisma.evalResponse.create({
    data: {
      subId: submission2.id,
      userId: students42[6].id,
      givenMarks: 55,
      comment: 'Several edge cases are missing and error handling needs work.',
      rating: 2
    }
  })

  const response3 = await prisma.evalResponse.create({
    data: {
      subId: submission4.id,
      userId: studentsWU[5].id,
      givenMarks: 90,
      comment: 'Clear model setup and convincing interpretation of fiscal multipliers.',
      rating: 5
    }
  })

  for (const section of evalSheet1.sections) {
    await prisma.evalSectionScore.create({
      data: {
        responseId: response1.id,
        sectionId: section.id,
        score: Math.min(section.marks, 25)
      }
    })
  }

  for (const section of evalSheet3.sections) {
    await prisma.evalSectionScore.create({
      data: {
        responseId: response3.id,
        sectionId: section.id,
        score: Math.min(section.marks, 22)
      }
    })
  }

  // A few manual sample EvalAssignments for testing.
  // Leave most assignment pairings empty so the generator can create them later.
  await prisma.evalAssignment.create({
    data: {
      assignmentId: assignment3.id,
      evalueeGroupId: macroGroups[0].id,
      evaluatorGroupId: macroGroups[1].id,
      evaluatorUserId: studentsWU[1].id,
      round: 1,
      submissionId: submission4.id,
      evalResponseId: response3.id,
      status: 'Submitted'
    }
  })

  await prisma.evalAssignment.create({
    data: {
      assignmentId: assignment3.id,
      evalueeGroupId: macroGroups[1].id,
      evaluatorGroupId: macroGroups[2].id,
      evaluatorUserId: studentsWU[2].id,
      round: 1,
      submissionId: submission5.id,
      status: 'Pending'
    }
  })

  await prisma.evalAssignment.create({
    data: {
      assignmentId: assignment1.id,
      evalueeGroupId: minishellGroups[0].id,
      evaluatorGroupId: minishellGroups[1].id,
      evaluatorUserId: students42[2].id,
      round: 1,
      submissionId: submission1.id,
      evalResponseId: response1.id,
      status: 'Submitted'
    }
  })

  await prisma.evalAssignment.create({
    data: {
      assignmentId: assignment1.id,
      evalueeGroupId: minishellGroups[1].id,
      evaluatorGroupId: minishellGroups[2].id,
      evaluatorUserId: students42[4].id,
      round: 1,
      submissionId: submission2.id,
      evalResponseId: response2.id,
      status: 'Submitted'
    }
  })
  // ============================================
  // Seed AuthAllowedEmail table
  // ============================================
  const adminUser = await prisma.user.findFirst({ where: { role: 'Admin' } });

  await prisma.authAllowedEmail.createMany({
    data: [
      {
        email: 'newstudent1@example.com',
        used: false,
        invited_by: adminUser ? adminUser.id : null,
      },
      {
        email: 'newstudent2@example.com',
        used: false,
        invited_by: adminUser ? adminUser.id : null,
      },
      {
        email: 'guest@example.com',
        used: false,
        invited_by: null,
      },
    ],
    skipDuplicates: true,
  });

  //console.log('AuthAllowedEmail seeded.');

  //console.log('Seed complete.')
  /*
  console.log({
    organizations: 2,
    users: 44,
    classes: 4,
    assignments: 4,
    groups: {
      minishell: minishellGroups.length,
      ft_transcendence: transcendenceGroups.length,
      macroMethods: macroGroups.length,
      advancedMacro: advancedMacroGroups.length
    },
    sampleEvalAssignments: 4
  })
 console.log(`\nSeed password for all users: \x1b[31m${SEED_PASSWORD}\x1b[0m\n`)
 */
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })