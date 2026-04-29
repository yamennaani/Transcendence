const { prisma } = require("../../database");

const getClasses = async(select = null)=>{
    const options = {}
    if(select)
        options.select = select
    return await prisma.class.findMany(options)
}

const getClassById = async(id, select = null, include = null)=>{
    if (!id || isNaN(id))
        throw new Error('Invalid class ID');
    const options = {where: {id: parseInt(id)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.class.findUnique(options)
}

const getAssignments = async(classId, select = null)=>{
    if (!classId || isNaN(classId))
        throw new Error('Invalid class ID');
    const options = {where:{classid: parseInt(classId)}}
    if(select)
        options.select = select
    return await prisma.assignment.findMany(options)
}

const getAssignmentById = async(id, select = null, include = null)=>{
    if (!id || isNaN(id))
        throw new Error('Invalid assignment ID');
    const options = {where: {id: parseInt(id)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.assignment.findUnique(options)
}

const getAssignmentByName = async(classId, assName, select = null, include = null)=>{
    const options = {where:{name: assName, classid: parseInt(classId)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.assignment.findFirst(options)
}

const getEnrollment = async (userId, classId, select = null, include = null)=>{
    const options = {where:{userId: parseInt(userId), classId: parseInt(classId)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.enrollment.findFirst(options)
}

const isEnrolledAndActive = async (userId, classId) => {
  const enrollment = await getEnrollment(userId, classId)
  return enrollment?.status === 'Active'
}

module.exports = {getClasses, getClassById,
     getAssignments, getAssignmentById, getAssignmentByName,
      getEnrollment, isEnrolledAndActive}