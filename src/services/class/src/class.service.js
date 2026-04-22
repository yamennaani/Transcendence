const { prisma } = require('../packages/database')
const logger = require('../packages/logger')
const {NotFoundError, ValidationError, ConflictError} = require('../packages/errors')
const utils = require('../packages/utils')

const getClasses = async ()=>{
    const select = {id:true, name:true, description:true, created_at:true, org_id:true}
    return await utils.getClasses(select)
}

const getClass = async (id)=>{
    const select = {id: true, name:true, description:true, created_at:true, org_id:true}
    const result = await utils.getClassById(id, select)
    if(!result)
        throw new NotFoundError("Class not found")
    return result
}

const getAssignments = async (classId)=>{
    const resultClass = await utils.getClassById(classId);
    if(!resultClass)
        throw new NotFoundError("Class Not Found")
    
    const select = {id: true, name: true, description: true, max_score:true, req_eval:true,
            created_at: true, classid:true}
    return await utils.getAssignments(classId, select)
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
        select:{name: true, description:true, org_id:true, created_by:true, pass_threshold: true}
    })
}

const createAssignment = async (classId, {name, description, maxScore, reqEval})=>{
    if(!classId || !name|| !description || !maxScore || !reqEval)
        throw new ValidationError("Invalid request")

    const targetClass = await utils.getClassById(classId)
    if(!targetClass)
        throw new NotFoundError("Class not Found")
    const existingAss = await utils.getAssignmentByName(classId, name, null)
    if(existingAss)
        throw new ConflictError('Assignment is already exist')
    const result = await prisma.assignment.create({
        data:{classid: parseInt(classId), name, description, max_score:parseInt(maxScore),
            req_eval:parseInt(reqEval)
        },
         select: {id: true, name: true, description: true, max_score:true, req_eval:true,
            created_at: true, classid:true}
    })
    return result
}

module.exports = {getClasses, createClass, getClass, createAssignment, getAssignments}