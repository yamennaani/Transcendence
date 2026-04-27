// src/packages/database/prisma/seed.js

const { PrismaClient } = require('../generated/prisma')
//const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Optional: clear existing data.
  // Delete child/dependent tables first to avoid FK errors.
  await prisma.evalSectionScore.deleteMany()
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

  //const passwordHash = await bcrypt.hash('password123', 10)
  const passwordHash = 'fake-hashed-password-for-dev'

  const org1 = await prisma.organization.create({
    data: {
      email: 'school42@example.com',
      name: '42 Sample School',
      tag: '42S',
      profile: {
        create: {
          bio: 'Sample organization for development.',
          tel_num: '+33000000001'
        }
      }
    }
  })

  const org2 = await prisma.organization.create({
    data: {
      email: 'academy@example.com',
      name: 'Transcendence Academy',
      tag: 'TAC',
      profile: {
        create: {
          bio: 'Second sample organization.',
          tel_num: '+33000000002'
        }
      }
    }
  })

  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      username: 'admin',
      role: 'Admin',
      orgId: org1.id,
      userAuth: {
        create: { pass_hash: passwordHash }
      },
      profile: {
        create: {
          bio: 'Admin test account',
          last_update: new Date()
        }
      }
    }
  })

  const bocal = await prisma.user.create({
    data: {
      email: 'bocal@example.com',
      username: 'bocal',
      role: 'Bocal',
      orgId: org1.id,
      userAuth: {
        create: { pass_hash: passwordHash }
      },
      profile: {
        create: {
          bio: 'Bocal test account',
          last_update: new Date()
        }
      }
    }
  })

  const students = []

  for (let i = 1; i <= 20; i++) {
    const student = await prisma.user.create({
      data: {
        email: `student${i}@example.com`,
        username: `student${i}`,
        role: 'Student',
        orgId: i <= 10 ? org1.id : org2.id,
        userAuth: {
          create: { pass_hash: passwordHash }
        },
        profile: {
          create: {
            bio: `Hello, I am student ${i}.`,
            last_update: new Date()
          }
        }
      }
    })

    students.push(student)
  }

  const class1 = await prisma.class.create({
    data: {
      name: 'Web Development Basics',
      description: 'Intro class for backend/frontend practice.',
      created_by: admin.id,
      org_id: org1.id,
      pass_threshold: 60
    }
  })

  const class2 = await prisma.class.create({
    data: {
      name: 'Transcendence Backend',
      description: 'Microservices, Prisma, Postgres and API design.',
      created_by: bocal.id,
      org_id: org1.id,
      pass_threshold: 70
    }
  })

  for (const student of students.slice(0, 12)) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        classId: class1.id,
        status: 'Active'
      }
    })
  }

  for (const student of students.slice(5, 18)) {
    await prisma.enrollment.create({
      data: {
        userId: student.id,
        classId: class2.id,
        status: 'Active'
      }
    })
  }

  const assignment1 = await prisma.assignment.create({
    data: {
      classid: class1.id,
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
      classid: class2.id,
      name: 'User Service API',
      description: 'Implement user service endpoints.',
      groupSize: 1,
      req_eval: 2,
      max_score: 100,
      pass_threshold: 70,
      requiresStaffReview: true,
      subtype: 'PDF'
    }
  })

  const evalSheet1 = await prisma.evalSheet.create({
    data: {
      assId: assignment1.id,
      sections: {
        create: [
          {
            name: 'Correctness',
            description: 'Does the submission work?',
            marks: 50,
            sectionType: 'Slider'
          },
          {
            name: 'Code Style',
            description: 'Is the code readable?',
            marks: 30,
            sectionType: 'Slider'
          },
          {
            name: 'Defense',
            description: 'Did the student explain the work?',
            marks: 20,
            sectionType: 'Toggle'
          }
        ]
      }
    },
    include: {
      sections: true
    }
  })

  const group1 = await prisma.group.create({
    data: {
      assId: assignment1.id,
      name: 'group-alpha',
      size: 2,
      leaderId: students[0].id,
      members: {
        create: [
          { userId: students[0].id },
          { userId: students[1].id }
        ]
      }
    }
  })

  const group2 = await prisma.group.create({
    data: {
      assId: assignment1.id,
      name: 'group-beta',
      size: 2,
      leaderId: students[2].id,
      members: {
        create: [
          { userId: students[2].id },
          { userId: students[3].id }
        ]
      }
    }
  })

  await prisma.groupInvite.create({
    data: {
      senderId: students[0].id,
      reciverId: students[4].id,
      targetGroupId: group1.id,
      status: 'Pending'
    }
  })

  const file1 = await prisma.file.create({
    data: {
      name: 'submission-alpha.zip',
      mimiType: 'application/zip',
      size: 123456,
      url: '/uploads/submission-alpha.zip',
      uploadedBy: students[0].id
    }
  })

  const submission1 = await prisma.submission.create({
    data: {
      groupId: group1.id,
      fileId: file1.id,
      status: 'Open',
      type: 'FILE',
      finalScore: null,
      passed: null
    }
  })

  const response1 = await prisma.evalResponse.create({
    data: {
      subId: submission1.id,
      userId: students[5].id,
      givenMarks: 85,
      comment: 'Good work overall.',
      rating: 4
    }
  })

  for (const section of evalSheet1.sections) {
    await prisma.evalSectionScore.create({
      data: {
        responseId: response1.id,
        sectionId: section.id,
        score: Math.min(section.marks, 20)
      }
    })
  }

  console.log('Seed complete.')
  console.log({
    organizations: 2,
    users: students.length + 2,
    classes: 2,
    assignments: 2,
    groups: 2
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })