const { prisma } = require('../packages/database')
const logger = require('../packages/logger')
const {NotFoundError, ValidationError, ConflictError} = require('../packages/errors')
const utils = require('../packages/utils')
const { createStorage } = require('../packages/fileManager')

let storage
(async () => {
  storage = createStorage('assignment-subjects')
  await storage.ensureBucket()
  await storage.makePublic()
})().catch(err => logger.error('class-service', 'Failed to initialize storage', err))

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

const getClassStudents = async (classId)=>{
    const targetClass = await utils.getClassById(classId)
    if(!targetClass)
        throw new NotFoundError("Class not found")

    const enrollments = await prisma.enrollment.findMany({
        where: { classId: parseInt(classId), status: 'Active' },
        select: { user: { select: { id: true, username: true, email: true, role: true, created_at: true } } }
    })
    return enrollments.map(e => e.user)
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

const createAssignment = async (classId, {name, description, maxScore, reqEval, createdBy}, reqFile)=>{
    if(!classId || !name|| !description || !maxScore || !reqEval)
        throw new ValidationError("Invalid request")

    const targetClass = await utils.getClassById(classId)
    if(!targetClass)
        throw new NotFoundError("Class not found")
    const existingAss = await utils.getAssignmentByName(classId, name, null)
    if(existingAss)
        throw new ConflictError('Assignment already exists')

    let subjectFile = null
    if (reqFile) {
        if (!createdBy)
            throw new ValidationError("createdBy is required to upload a subject file")

        const fileName = `assignment-${classId}-${Date.now()}-${reqFile.originalname}`
        await storage.upload(fileName, reqFile.buffer, reqFile.mimetype, reqFile.size)
        subjectFile = await prisma.file.create({
            data: {
                name: reqFile.originalname,
                mimiType: reqFile.mimetype,
                size: reqFile.size,
                url: storage.getPublicUrl(fileName),
                uploadedBy: parseInt(createdBy),
            },
            select: {id: true, name: true, url: true, mimiType: true, size: true}
        })
    }

    const result = await prisma.assignment.create({
        data:{classid: parseInt(classId), name, description, max_score:parseInt(maxScore),
            req_eval:parseInt(reqEval), ...(subjectFile && { fileId: subjectFile.id })
        },
         select: {id: true, name: true, description: true, max_score:true, req_eval:true,
            created_at: true, classid:true, fileId:true}
    })
    return {...result, file: subjectFile}
}

const attachSubjectFile = async (assignments)=>{
    const list = Array.isArray(assignments) ? assignments : [assignments]
    const fileIds = [...new Set(list.filter(a => a.fileId).map(a => a.fileId))]
    if(fileIds.length === 0)
        return list.map(a => ({...a, file: null}))

    const files = await prisma.file.findMany({
        where: {id: {in: fileIds}},
        select: {id: true, name: true, url: true, mimiType: true, size: true}
    })
    const fileMap = new Map(files.map(f => [f.id, f]))
    return list.map(a => ({...a, file: a.fileId ? (fileMap.get(a.fileId) ?? null) : null}))
}

const getAssignments = async (classId)=>{
    const targetClass = await utils.getClassById(classId);
    if(!targetClass)
        throw new NotFoundError("Class not found")

    const select = {id: true, name: true, description: true, max_score:true, req_eval:true,
            created_at: true, classid:true, fileId:true, groupSize:true, pass_threshold:true}
    const assignments = await utils.getAssignments(parseInt(classId), select)
    return await attachSubjectFile(assignments)
}

const getAssignmentById = async (assignId)=>{
    const select = {id: true, classid: true, name: true, description: true, created_at: true,
            groupSize: true, req_eval: true, max_score: true, pass_threshold: true, subtype: true, fileId: true }
    const result = await utils.getAssignmentById(assignId, select, {
        groups: {
            include: {
                members: true
            }
        }
    })
    if(!result)
        throw new NotFoundError("Assignment not found")
    return (await attachSubjectFile(result))[0]
}

const updateAssignment = async (assignId, {classId, name, description, groupSize, reqEval, maxScore, passThreshold, createdBy}, reqFile)=>{
    if(!assignId ||!classId || !name|| !description || !groupSize || !reqEval|| !maxScore || !passThreshold )
        throw new ValidationError("Invalid request")

    const targetAssign = await utils.getAssignmentById(assignId)
    if(!targetAssign)
        throw new NotFoundError("Assignment not found")

    const targetClass = await utils.getClassById(classId)
    if(!targetClass)
        throw new NotFoundError("Class not found")

    let fileId = targetAssign.fileId
    if (reqFile) {
        if (!createdBy)
            throw new ValidationError("createdBy is required to upload a subject file")

        const fileName = `assignment-${classId}-${Date.now()}-${reqFile.originalname}`
        await storage.upload(fileName, reqFile.buffer, reqFile.mimetype, reqFile.size)
        const fileData = {
            name: reqFile.originalname,
            mimiType: reqFile.mimetype,
            size: reqFile.size,
            url: storage.getPublicUrl(fileName),
            uploadedBy: parseInt(createdBy),
        }
        if (targetAssign.fileId) {
            const updatedFile = await prisma.file.update({ where: { id: targetAssign.fileId }, data: fileData })
            fileId = updatedFile.id
        } else {
            const newFile = await prisma.file.create({ data: fileData })
            fileId = newFile.id
        }
    }

    const result = await prisma.assignment.update({
        where: { id: parseInt(assignId) },
        data: { classid: parseInt(classId), name, description, groupSize: parseInt(groupSize), req_eval:parseInt(reqEval), max_score: parseInt(maxScore),
                    pass_threshold: parseInt(passThreshold), ...(reqFile && { fileId }) },
        select: {id: true, classid: true, name: true, description: true, groupSize: true, req_eval: true, max_score: true,
            created_at: true, fileId: true}
    })
    return (await attachSubjectFile(result))[0]
}

const deleteAssignment = async (assignId)=>{
    const targetAssign = await getAssignmentById(assignId)
    if (!targetAssign)
        throw new NotFoundError('Assignment not found')
    
    await prisma.assignment.delete({where: {id: parseInt(assignId)}})
 
    return {
        message: 'Assignment deleted successfully',
        id: assignId }
}

module.exports = {getClasses, createClass, getClassById, getClassByOrgId, updateClass, deleteClass, getClassStudents,
    createAssignment, getAssignments, getAssignmentById, updateAssignment, deleteAssignment}
