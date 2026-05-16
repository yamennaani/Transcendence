const { prisma } = require('../packages/database')
const {NotFoundError, ValidationError, ConflictError} = require('../packages/errors')
const utils = require('../packages/utils')

// TODO Move to Class Service cuz its not place here XD
const getAssignment = async(assId)=>{
    if(!assId)
        throw new ValidationError('Invalid request')
    const ass =  await utils.getAssignment(assId)
    if(!ass)
        throw new NotFoundError('Assignment not found')
    return ass;
}

const createEvalSheet = async ({assId})=>{
    if(!assId)
        throw new ValidationError('Invalid request')
    const ass = await utils.getAssignment(assId, null, {evalSheet:true})
    if(!ass)
        throw new NotFoundError('Assignment not found')
    if(ass.evalSheet)
        throw new ConflictError('Assignment has already an evalsheet')
    return await prisma.evalSheet.create({
        data:{assId: parseInt(assId)}
    })
}

const validateString = (str)=>{
    return (str && str.length > 0)
}

const validateSectionType = (type)=>{
    return(type.length > 0 &&(type === 'Toggle' || type === 'Slider'))
}

const createEvalSection = async(sheetId, 
    {name, description, marks, sectionType})=>{
    if(!sheetId || !validateString(name) || !validateString(description) || 
        !marks || parseInt(marks) <= 0 || !validateSectionType(sectionType))
        throw new ValidationError('invalide request')
    const sheet = await utils.getEvalSheetById(sheetId)
    if(!sheet)
        throw new NotFoundError('EvalSheet not found')
    return await prisma.evalSection.create({
        data:{name, description, sectionType, 
            marks: parseInt(marks), evalSheetId: parseInt(sheetId)}
    })
}

const getEvalSheetById = async (id)=>{
    if(!id)
        throw new ValidationError('invalid request')
    const sheet =  await utils.getEvalSheetById(id, null, {sections:true})
    if(!sheet)
        throw new NotFoundError('EvalSheet not found')
    return sheet
}

const getEvalSheetByAssId = async (assId)=>{
    if(!assId)
        throw new ValidationError('invalid request')
    const ass = await utils.getAssignmentById(assId, null, {evalSheet: {include:{sections:true}}})
    if(!ass)
        throw new NotFoundError('Assignment not found')
    if(!ass.evalSheet)
        throw new NotFoundError('EvalSheet not found')
    return ass.evalSheet
}

const updateEvalSheetSection = async (sheetId, {secId, name, description, marks, sectionType})=>{
    if(!sheetId || !secId)
        throw new ValidationError('invalid request')
    const sheet =  await utils.getEvalSheetById(sheetId, null, {sections:true})
    if(!sheet)
        throw new NotFoundError('Evalsheet not found')
    const existSection = sheet.sections.some(sec => sec.id === parseInt(secId))
    if(!existSection)
        throw new NotFoundError('Section not found')

    const newName = (name.length > 0) ? name: existSection.name
    const newDesc = (description.length > 0) ? description: existSection.description
    const newMarks = (parseInt(marks) > 0) ? parseInt(marks) : parseInt(existSection.marks)
    const newtype = (validateSectionType(sectionType))? sectionType: existSection.sectionType
     
    return await prisma.evalSection.update({
        where:{id: parseInt(secId)},
        data:{name: newName, description: newDesc, marks: newMarks, sectionType: newtype}
    })
}

const removeSection = async (sheetId, {secId})=>{
    if(!sheetId || !secId)
        throw new ValidationError('invalid request')
    console.log('HI')
    const sheet =  await utils.getEvalSheetById(sheetId, null, {sections:true})
    if(!sheet)
        throw new NotFoundError('Evalsheet not found')
    const existSection = sheet.sections.some(sec => sec.id === parseInt(secId))
    if(!existSection)
        throw new NotFoundError('Section not found')
    await prisma.evalSection.delete({where: {id: parseInt(secId)}})
    return{
        message: 'Section deleted successfully',
        id: parseInt(secId)
    }
}

// methods pertaining to EvalAssignment model/table:

const getEvalAssignments = async (assignmentId)=>{
  const assignmentIdInt = parseInt(assignmentId)

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentIdInt } })
  if (!assignment)
    throw new NotFoundError('Assignment not found')

  const select = { id: true, assignmentId: true, evalueeGroupId: true, evaluatorGroupId: true,
                   evaluatorUserId: true, round: true, status: true, submissionId: true,
                   evalResponseId: true, createdAt: true }
  return await utils.getEvalAssignments(assignmentIdInt, select)
}

const getEvalAssignmentById = async (evalAssignmentId) => {
  const evalAssignmentIdInt = parseInt(evalAssignmentId)

  const select = { id: true, assignmentId: true, evalueeGroupId: true, evaluatorGroupId: true,
                   evaluatorUserId: true, round: true, status: true, submissionId: true,
                   evalResponseId: true, createdAt: true }

  const result = await utils.getEvalAssignmentById(evalAssignmentIdInt, select)
  if (!result)
    throw new NotFoundError('Eval assignment not found')

  return result
}

const createEvalAssignment = async ({assignmentId, evalueeGroupId, evaluatorGroupId, evaluatorUserId, round}) => {
  const assignmentIdInt     = parseInt(assignmentId)
  const evalueeGroupIdInt   = parseInt(evalueeGroupId)
  const evaluatorGroupIdInt = parseInt(evaluatorGroupId)
  const evaluatorUserIdInt  = parseInt(evaluatorUserId)
  const roundInt            = parseInt(round)

  if (!assignmentIdInt || !evalueeGroupIdInt || !evaluatorGroupIdInt || !evaluatorUserIdInt || !roundInt)
    throw new ValidationError('assignmentId, evalueeGroupId, evaluatorGroupId, evaluatorUserId and round are required')

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentIdInt } })
  if (!assignment)
    throw new NotFoundError('Assignment not found')

  const evalueeGroup = await prisma.group.findUnique({ where: { id: evalueeGroupIdInt } })
  if (!evalueeGroup)
    throw new NotFoundError('Evaluee group not found')
  if (evalueeGroup.assId !== assignmentIdInt)
    throw new ValidationError('Evaluee group does not belong to this assignment')

  const evaluatorGroup = await prisma.group.findUnique({ where: { id: evaluatorGroupIdInt } })
  if (!evaluatorGroup)
    throw new NotFoundError('Evaluator group not found')
  if (evaluatorGroup.assId !== assignmentIdInt)
    throw new ValidationError('Evaluator group does not belong to this assignment')

  if (evaluatorGroupIdInt === evalueeGroupIdInt)
    throw new ValidationError('Evaluator group cannot evaluate itself')

  const memberEvaluatorGroup = await prisma.groupMember.findUnique({
    where: { userId_groupId: {
        userId: evaluatorUserIdInt,
        groupId: evaluatorGroupIdInt } } })
  if (!memberEvaluatorGroup)
    throw new ValidationError('Evaluator user is not a member of evaluator group')

  const existingEvalAssignment = await prisma.evalAssignment.findUnique({
    where: { assignmentId_evalueeGroupId_evaluatorUserId_round: {
                assignmentId: assignmentIdInt, evalueeGroupId: evalueeGroupIdInt,
                evaluatorUserId: evaluatorUserIdInt, round: roundInt } } })
  if (existingEvalAssignment)
    throw new ConflictError('Eval assignment already exists')

  return await prisma.evalAssignment.create({
    data: { assignmentId: assignmentIdInt, evalueeGroupId: evalueeGroupIdInt, evaluatorGroupId: evaluatorGroupIdInt,
            evaluatorUserId: evaluatorUserIdInt, round: roundInt },
    select: { id: true, assignmentId: true, evalueeGroupId: true, evaluatorGroupId: true,
              evaluatorUserId: true, round: true, status: true, createdAt: true } })
}

const updateEvalAssignment = async (evalAssignmentId, { assignmentId, evalueeGroupId, evaluatorUserId, evaluatorGroupId, 
                                    round, status, submissionId, evalResponseId}) => {
  const evalAssignmentIdInt = parseInt(evalAssignmentId)
  const assignmentIdInt     = parseInt(assignmentId)
  const evalueeGroupIdInt   = parseInt(evalueeGroupId)
  const evaluatorUserIdInt  = parseInt(evaluatorUserId)
  const evaluatorGroupIdInt = parseInt(evaluatorGroupId)
  const roundInt            = parseInt(round)
  const submissionIdInt     = submissionId   ? parseInt(submissionId)   : null
  const evalResponseIdInt   = evalResponseId ? parseInt(evalResponseId) : null      
  
  if (!evalAssignmentIdInt || !assignmentIdInt || !evalueeGroupIdInt || !evaluatorGroupIdInt 
      || !evaluatorUserIdInt || !roundInt || !status)
    throw new ValidationError('evalAssignmentId, assignmentId, evalueeGroupId, evaluatorGroupId, evaluatorUserId and round are required')

  const targetEvalAssign = await utils.getEvalAssignmentById(evalAssignmentIdInt)
  if(!targetEvalAssign)
    throw new NotFoundError("Evaluation assignment not found")

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentIdInt } })
  if (!assignment)
    throw new NotFoundError('Assignment not found')

  const evalueeGroup = await prisma.group.findUnique({ where: { id: evalueeGroupIdInt } })
  if (!evalueeGroup)
    throw new NotFoundError('Evaluee group not found')
  if (evalueeGroup.assId !== assignmentIdInt)
    throw new ValidationError('Evaluee group does not belong to this assignment')

  const evaluatorGroup = await prisma.group.findUnique({ where: { id: evaluatorGroupIdInt } })
  if (!evaluatorGroup)
    throw new NotFoundError('Evaluator group not found')
  if (evaluatorGroup.assId !== assignmentIdInt)
    throw new ValidationError('Evaluator group does not belong to this assignment')

  if (evaluatorGroupIdInt === evalueeGroupIdInt)
    throw new ValidationError('Evaluator group cannot evaluate itself')

  const memberEvaluatorGroup = await prisma.groupMember.findUnique({
    where: { userId_groupId: {
        userId: evaluatorUserIdInt,
        groupId: evaluatorGroupIdInt } } })
  if (!memberEvaluatorGroup)
    throw new ValidationError('Evaluator user is not a member of evaluator group')

  const validStatuses = ['Pending', 'Submitted', 'Cancelled']
  if (!validStatuses.includes(status))
    throw new ValidationError('Invalid status')

  if ((submissionId && isNaN(submissionIdInt)) || (evalResponseId && isNaN(evalResponseIdInt)))
    throw new ValidationError('Invalid submissionId or evalResponseId')
  if (submissionIdInt !== null) {
    const submission = await prisma.submission.findUnique({ where: { id: submissionIdInt } })
    if (!submission)
        throw new NotFoundError('Submission not found') }
  if (evalResponseIdInt !== null) {
    const evalResponse = await prisma.evalResponse.findUnique({ where: { id: evalResponseIdInt } })
  if (!evalResponse)
    throw new NotFoundError('Eval response not found') }

  const existingEvalAssignment = await prisma.evalAssignment.findFirst({
    where: { assignmentId: assignmentIdInt, evalueeGroupId: evalueeGroupIdInt,
             evaluatorUserId: evaluatorUserIdInt, round: roundInt },
             NOT: { id: evalAssignmentIdInt } })
  if (existingEvalAssignment)
    throw new ConflictError('Eval assignment already exists')  

  const result = await prisma.evalAssignment.update({
    where: { id: evalAssignmentIdInt },
    data: { assignmentId: assignmentIdInt, evalueeGroupId: evalueeGroupIdInt, 
            evaluatorUserId: evaluatorUserIdInt, evaluatorGroupId: evaluatorGroupIdInt, round: roundInt, 
            status: status, submissionId: submissionIdInt, evalResponseId: evalResponseIdInt },
    select: {id: true, assignmentId: true, evalueeGroupId: true, evaluatorUserId: true, evaluatorGroupId: true, 
             round: true, status: true, submissionId: true, evalResponseId: true, createdAt: true} })
    return result
}


const deleteEvalAssignment = async (evalAssignmentId) => {
  const evalAssignmentIdInt = parseInt(evalAssignmentId)

  await getEvalAssignmentById(evalAssignmentIdInt)
    
  await prisma.evalAssignment.delete({where: {id: evalAssignmentIdInt}})
 
  return {
    message: 'Eval assignment deleted successfully',
    id: evalAssignmentIdInt }
}

module.exports = {getEvalSheetById, getEvalSheetByAssId, getAssignment, createEvalSheet, createEvalSection,
    updateEvalSheetSection, removeSection, 
    getEvalAssignments, getEvalAssignmentById, createEvalAssignment, updateEvalAssignment, deleteEvalAssignment
}