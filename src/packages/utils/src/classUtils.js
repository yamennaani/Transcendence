const { prisma } = require("../../database");

const getClasses = async(select = null)=>{
    const options = {}
    if(select)
        options.select = select
    return await prisma.class.findMany(options)
}

const getClassById = async(idClass, select = null, include = null)=>{
    if (!idClass || isNaN(idClass))
        throw new Error('Invalid class ID');
    const options = {where: {id: parseInt(idClass)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.class.findUnique(options)
}

const getClassByOrgId = async(idOrg, select = null, include = null)=>{
    if (!idOrg || isNaN(idOrg))
        throw new Error('Invalid org ID');
    const options = {where: {org_id: parseInt(idOrg)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.class.findMany(options)
}

const getAssignments = async(classId, select = null)=>{
    if (!classId || isNaN(classId))
        throw new Error('Invalid class ID');
    const options = {where:{classid: parseInt(classId)}}
    if(select)
        options.select = select
    return await prisma.assignment.findMany(options)
}

const getAssignmentById = async(assignId, select = null, include = null)=>{
    if (!assignId || isNaN(assignId))
        throw new Error('Invalid assignment ID');
    const options = {where: {id: parseInt(assignId)}}
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

module.exports = {getClasses, getClassById, getClassByOrgId, 
     getAssignments, getAssignmentById, getAssignmentByName,
      getEnrollment, isEnrolledAndActive}