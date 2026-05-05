const { prisma } = require('../packages/database')
const logger = require('../packages/logger')
const {NotFoundError, ValidationError, ConflictError} = require('../packages/errors')
const utils = require('../packages/utils')

const getClasses = async ()=>{
    const select = {id:true, name:true, description:true, created_at:true, org_id:true}
    return await utils.getClasses(select)
}

const getClassById = async (classId)=>{
    const select = {id: true, name:true, description:true, created_at:true, org_id:true}
    const result = await utils.getClassById(parseInt(classId), select)
    if(!result)
        throw new NotFoundError("Class not found")
    return result
}

const getClassByOrgId = async (orgId)=>{
    const select = {id: true, name:true, description:true, created_at:true, org_id:true}
    const result = await utils.getClassByOrgId(parseInt(orgId), select)
    if(!result)
        throw new NotFoundError("Org not found")
    return result
}

const createClass = async ({org_id, created_by, name, description, pass_threshold})=>{
    if(!org_id || !created_by || !name || !description || !pass_threshold)
        throw new ValidationError("invalid request")
    
    const org = await utils.getOrgById(org_id)
    if(!org)
        throw new NotFoundError('Org not found')

    const user = await utils.getUserById(created_by)
    if(!user)
        throw new NotFoundError('User not found')

    return await prisma.class.create({
        data: {name, description, org_id:parseInt(org_id), created_by:parseInt(created_by), pass_threshold:parseFloat(pass_threshold)},
        select:{name: true, description: true, org_id: true, created_by: true, pass_threshold: true}
    })
}

const updateClass = async (classId, {org_id, created_by, name, description, pass_threshold})=>{     
    if(!org_id || !created_by || !name || !description || !pass_threshold)
        throw new ValidationError("invalid request")
    
    const targetClass = getClassById(classId)
    if (!targetClass)
        throw new NotFoundError('Class not found')

    const org = await utils.getOrgById(org_id)
    if(!org)
        throw new NotFoundError('Org not found')

    const user = await utils.getUserById(created_by)
    if(!user)
        throw new NotFoundError('User not found')

    return await prisma.class.update({
        where: { id: parseInt(classId) },
        data: {name, description, org_id:parseInt(org_id), created_by:parseInt(created_by), pass_threshold:parseFloat(pass_threshold)},
        select:{name: true, description: true, org_id: true, created_by: true, pass_threshold: true}
    })
}

const deleteClass = async (classId)=>{
    const targetClass = getClassById(classId)
    if (!targetClass)
        throw new NotFoundError('Class not found')
    
    await prisma.class.delete({where: {id: parseInt(classId)}})
 
    return {
        message: 'Course deleted successfully',
        id: classId }
}

const createAssignment = async (classId, {name, description, maxScore, reqEval})=>{
    if(!classId || !name|| !description || !maxScore || !reqEval)
        throw new ValidationError("Invalid request")

    const targetClass = await utils.getClassById(classId)
    if(!targetClass)
        throw new NotFoundError("Class not found")
    const existingAss = await utils.getAssignmentByName(classId, name, null)
    if(existingAss)
        throw new ConflictError('Assignment already exists')
    const result = await prisma.assignment.create({
        data:{classid: parseInt(classId), name, description, max_score:parseInt(maxScore),
            req_eval:parseInt(reqEval)
        },
         select: {id: true, name: true, description: true, max_score:true, req_eval:true,
            created_at: true, classid:true}
    })
    return result
}

const getAssignments = async (classId)=>{
    const targetClass = await utils.getClassById(classId);
    if(!targetClass)
        throw new NotFoundError("Class not found")
    
    const select = {id: true, name: true, description: true, max_score:true, req_eval:true,
            created_at: true, classid:true}
    return await utils.getAssignments(parseInt(classId), select)
}

const getAssignmentById = async (assignId)=>{
    const select = {id: true, classid: true, name: true, description: true, created_at: true,
            groupSize: true, req_eval: true, max_score: true, pass_threshold: true }
    const result = await utils.getAssignmentById(assignId, select)
    if(!result)
        throw new NotFoundError("Assignment not found")
    return result
}

const updateAssignment = async (assignId, {classId, name, description, groupSize, reqEval, maxScore, passThreshold})=>{
    if(!assignId ||!classId || !name|| !description || !groupSize || !reqEval|| !maxScore || !passThreshold )
        throw new ValidationError("Invalid request")
    
    const targetAssign = await utils.getAssignmentById(assignId)
    if(!targetAssign)
        throw new NotFoundError("Assignment not found")

    const targetClass = await utils.getClassById(classId)
    if(!targetClass)
        throw new NotFoundError("Class not found")

    const result = await prisma.assignment.update({
        where: { id: parseInt(assignId) },
        data: { classid: parseInt(classId), name, description, groupSize: parseInt(groupSize), req_eval:parseInt(reqEval), max_score: parseInt(maxScore), 
                    pass_threshold: parseInt(passThreshold)},
        select: {id: true, classid: true, name: true, description: true, groupSize: true, req_eval: true, max_score: true, 
            created_at: true}
    })
    return result
}

const deleteAssignment = async (assignId)=>{
    const targetAssign = getAssignmentById(assignId)
    if (!targetAssign)
        throw new NotFoundError('Assignment not found')
    
    await prisma.assignment.delete({where: {id: parseInt(assignId)}})
 
    return {
        message: 'Assignment deleted successfully',
        id: assignId }
}

module.exports = {getClasses, createClass, getClassById, getClassByOrgId, updateClass, deleteClass,
    createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment}
