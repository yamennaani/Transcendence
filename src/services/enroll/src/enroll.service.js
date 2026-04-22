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

    return await prisma.enrollment.update({
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
}

module.exports = {enrollStudent, dropStudent}