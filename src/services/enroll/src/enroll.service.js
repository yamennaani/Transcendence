const { prisma } = require('../packages/database')
const {NotFoundError, ValidationError, ConflictError} = require('../packages/errors')
const utils = require('../packages/utils')

const enrollStudent = async ({ classId, studentId }) => {
  if (!classId || !studentId)
    throw new ValidationError('Invalid request')

  const resultClass = await utils.getClassById(classId)
  if (!resultClass) throw new NotFoundError('Class Not Found')

  const user = await utils.getUserById(studentId)
  if (!user) throw new NotFoundError('Student Not Found')

  const existing = await utils.getEnrollment(studentId, classId)

  if (existing && existing.status === 'Active')
    throw new ConflictError('Student is already enrolled')

  if (existing && existing.status === 'Dropped') {
    return await prisma.enrollment.update({
      where: { id: existing.id },
      data: { status: 'Active' },
      select: { id: true, userId: true, classId: true, enrollDate: true, status: true }
    })
  }

  return await prisma.enrollment.create({
    data: { userId: parseInt(studentId), classId: parseInt(classId), status: 'Active' },
    select: { id: true, userId: true, classId: true, enrollDate: true, status: true }
  })
}

const dropStudent = async ({classId, studentId})=>{
    if(!classId || !studentId)
        throw new ValidationError("Invalid request")
    const resultClass = await utils.getClassById(classId)
    if(!resultClass) throw new NotFoundError('Class Not Found')

    const user = await utils.getUserById(studentId)
    if(!user) throw new NotFoundError("Student Not Found")
    
    const existing = await utils.getEnrollment(studentId, classId)
    if(!existing) throw new ConflictError('Student is not enrolled')

    const result = await prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: 'Dropped' },
        select: {
            id: true,
            userId: true,
            classId: true,
            status: true,
            enrollDate: true
        }
    })

    // Consequence: a dropped student can no longer take part in this class's
    // assignment groups — leave their groups, promoting a new leader (or
    // deleting the group entirely) when they were the sole member/leader.
    await leaveClassGroups(studentId, classId)

    return result
}

const leaveClassGroups = async (studentId, classId)=>{
    const memberships = await prisma.groupMember.findMany({
        where: { userId: parseInt(studentId), group: { assignment: { classid: parseInt(classId) } } },
        include: { group: { include: { members: true } } }
    })

    for (const membership of memberships) {
        const group = membership.group
        const remaining = group.members.filter(m => m.userId !== parseInt(studentId))

        if (remaining.length === 0) {
            await prisma.group.delete({ where: { id: group.id } })
            continue
        }
        if (group.leaderId === parseInt(studentId)) {
            await prisma.group.update({ where: { id: group.id }, data: { leaderId: remaining[0].userId } })
        }
        await prisma.groupMember.delete({ where: { id: membership.id } })
    }
}

const getEnrollement = async(studentId)=>{
  if(!studentId)
    throw new ValidationError('invalid request')
  const user = await utils.getUserById(studentId, null, {enrollments:true})
  if(!user)
    throw new NotFoundError('User not found')
  return user.enrollments
}

const getEnrolledClasses = async(studentId, filter)=>{
  if(!studentId)
    throw new ValidationError('invalid request')
  const user = await utils.getUserById(studentId, null,
    { enrollments: {
      include:{class:{
        include:{
          assignments:true
        }
      }}
    }})
  if(!user)
    throw new NotFoundError('User not found')
  const enrolledClasses = user.enrollments.map(enroll => enroll.class)
  return enrolledClasses

}

module.exports = {enrollStudent, dropStudent, getEnrollement, getEnrolledClasses}