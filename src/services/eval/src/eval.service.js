const { prisma } = require('../packages/database')
const {NotFoundError, ValidationError, ConflictError, UnauthorizedError} = require('../packages/errors')
const utils = require('../packages/utils')
const { createStorage } = require('../packages/fileManager')
const storage = createStorage('submissions')

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
    //console.log('HI')
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

// get all EvalAssignments for one particular assignment.id
const getEvalAssignments = async (assignmentId)=>{
  const assignmentIdInt = parseInt(assignmentId)

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentIdInt } })
  if (!assignment)
    throw new NotFoundError('Assignment not found')

  const select = { id: true, assignmentId: true, evalueeGroupId: true, evaluatorGroupId: true,
                   evaluatorUserId: true, round: true, status: true, submissionId: true,
                   evalResponseId: true, createdAt: true,
                   evaluatorUser: { select: { id: true, username: true, email: true } } }
  return await utils.getEvalAssignments(assignmentIdInt, select)
}

// delete all EvalAssignments for one particular assignment.id
const deleteEvalAssignments = async (assignmentId) => {
  const assignmentIdInt = parseInt(assignmentId)
  if (!assignmentIdInt)
    throw new ValidationError('Invalid assignment id')

  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentIdInt } })
  if (!assignment)
    throw new NotFoundError('Assignment not found')

  const result = await prisma.evalAssignment.deleteMany({ where: { assignmentId: assignmentIdInt } })
  return { message: 'Eval assignments deleted successfully', assignmentId: assignmentIdInt, count: result.count }
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
             evaluatorUserId: evaluatorUserIdInt, round: roundInt,
             NOT: { id: evalAssignmentIdInt } } })
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

// Pairing algorithm: simple circular multi-round pairings
// Round 1: evaluee i <- evaluator i+1,
// Round 2: evaluee i <- evaluator i+2,
// Round 3: evaluee i <- evaluator i+3, ...
// Groups are shuffled once at the beginning so the result does not simply depend on creation order.
// helper function 1: 
const seededRandom = (seed) => {
  let value = seed % 2147483647
  if (value <= 0) value += 2147483646
  return () => { 
    value = value * 16807 % 2147483647
    return (value - 1) / 2147483646
  }
}
// helper function 2: 
const shuffleWithSeed = (array, seed) => {
  const result = [...array]
  const random = seededRandom(seed)
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}
// pairing algorithm: generate circular offset pairings across rounds.
const generateSimpleEvalAssignmentPairings = async (assignmentId) => {
  const assignmentIdInt = parseInt(assignmentId)

  const assignment = await utils.getAssignmentById(assignmentIdInt)
  if (!assignment)
    throw new NotFoundError('Assignment not found')

  const groups = await utils.getEligibleGroupsForAssignment(assignmentIdInt)

  if (groups.length < 2)
    throw new ValidationError(
    `At least 2 groups with members are required to generate pairings. ` +
    `Please add students to groups first.`)

  const requiredRounds = parseInt(assignment.req_eval)
  //console.log('assignment:', assignment)
  //console.log('assignment.req_eval:', assignment.req_eval)
  //console.log('requiredRounds:', requiredRounds)
  if (!requiredRounds || requiredRounds <= 0)
    throw new ValidationError('Assignment has invalid required eval count')

  if (requiredRounds > groups.length - 1)
    throw new ValidationError(
    `This assignment requires ${requiredRounds} evaluation rounds, but there are only ${groups.length} groups. ` +
    `With ${groups.length} groups, at most ${groups.length - 1} non-repeating evaluator rounds are possible. ` +
    `Please either reduce the required evaluations to ${groups.length - 1} or add more groups.`)

  // Sort first so the shuffle is reproducible independent of DB return order.
  const sortedGroups = [...groups].sort((a, b) => a.id - b.id)
  // Seed by assignment id so the same assignment gets the same generated schedule.
  const shuffledGroups = shuffleWithSeed(sortedGroups, assignmentIdInt)

  const createdEvalAssignments = []

  for (let round = 1; round <= requiredRounds; round++) {
    const shift = round

    for (let i = 0; i < shuffledGroups.length; i++) {
      const evalueeGroup = shuffledGroups[i]
      const evaluatorGroup = shuffledGroups[(i + shift) % shuffledGroups.length]

      if (evalueeGroup.id === evaluatorGroup.id)
        throw new ValidationError('Generated invalid self-evaluation pairing')

      const evaluatorMembers = evaluatorGroup.members ?? []

      if (evaluatorMembers.length === 0)
        throw new ValidationError('Evaluator group has no members')

      // Rotate evaluator user across rounds.
      // For group size 2, round 1 uses member 0, round 2 uses member 1, round 3 uses member 0 again.
      const evaluatorMember = evaluatorMembers[(round - 1) % evaluatorMembers.length]
      const evaluatorUser = evaluatorMember.user

      if (!evaluatorUser)
        throw new ValidationError('Evaluator member has no user')

      const evalAssignment = await createEvalAssignment({
        assignmentId: assignmentIdInt,
        evalueeGroupId: evalueeGroup.id,
        evaluatorGroupId: evaluatorGroup.id,
        evaluatorUserId: evaluatorUser.id,
        round
      })

      createdEvalAssignments.push(evalAssignment)
    }
  }

  return {
    message: 'Eval assignment pairings generated successfully',
    assignmentId: assignmentIdInt,
    rounds: requiredRounds,
    count: createdEvalAssignments.length,
    evalAssignments: createdEvalAssignments
  }
}


const getAssignmentWithSheet = async (assignmentId)=>{
    return await utils.getAssignmentById(assignmentId, null, {evalSheet: {include: {sections: true}}})
}

const startEvaluation = async ({evaluatorUserId, leaderEmail, passkey})=>{
    const evaluatorUserIdInt = parseInt(evaluatorUserId)
    if(!evaluatorUserIdInt || !leaderEmail || !passkey)
        throw new ValidationError('evaluatorUserId, leaderEmail and passkey are required')

    const leader = await utils.searchUser(leaderEmail)
    if(!leader)
        throw new NotFoundError('No user found with that email')

    const submission = await utils.getSubmissionByPasskey(passkey, null, {group: true, file: true})
    if(!submission)
        throw new NotFoundError('Invalid passkey')
    if(submission.status !== 'Close')
        throw new ValidationError('Submission is not closed yet')
    if(submission.group.leaderId !== leader.id)
        throw new ValidationError("That email is not the leader of this submission's group")

    const evalAssignment = await prisma.evalAssignment.findFirst({
        where: { evaluatorUserId: evaluatorUserIdInt, evalueeGroupId: submission.groupId, status: 'Pending' },
        orderBy: { round: 'asc' }
    })
    if(!evalAssignment)
        throw new UnauthorizedError("You haven't been assigned to evaluate this group")

    if(evalAssignment.submissionId && evalAssignment.submissionId !== submission.id)
        throw new ValidationError('Mismatched submission for this evaluation pairing')
    if(!evalAssignment.submissionId){
        await prisma.evalAssignment.update({
            where: { id: evalAssignment.id },
            data: { submissionId: submission.id }
        })
    }

    const assignment = await getAssignmentWithSheet(evalAssignment.assignmentId)
    if(!assignment?.evalSheet)
        throw new NotFoundError('This assignment has no eval sheet yet')

    const file = submission.file
        ? { ...submission.file, url: storage.getPublicUrl(submission.file.url) }
        : null

    return {
        evalAssignmentId: evalAssignment.id,
        assignment: { id: assignment.id, name: assignment.name, description: assignment.description, max_score: assignment.max_score },
        group: { id: submission.group.id, name: submission.group.name },
        submission: { id: submission.id, file },
        evalSheet: assignment.evalSheet
    }
}

const submitEvaluation = async ({evalAssignmentId, evaluatorUserId, comment, scores})=>{
    const evalAssignmentIdInt = parseInt(evalAssignmentId)
    const evaluatorUserIdInt = parseInt(evaluatorUserId)
    if(!evalAssignmentIdInt || !evaluatorUserIdInt || !validateString(comment) || !Array.isArray(scores) || scores.length === 0)
        throw new ValidationError('evalAssignmentId, evaluatorUserId, comment and scores are required')

    const evalAssignment = await utils.getEvalAssignmentById(evalAssignmentIdInt)
    if(!evalAssignment)
        throw new NotFoundError('Eval assignment not found')
    if(evalAssignment.evaluatorUserId !== evaluatorUserIdInt)
        throw new UnauthorizedError('This is not your evaluation')
    if(evalAssignment.status !== 'Pending')
        throw new ConflictError('This evaluation has already been submitted')
    if(!evalAssignment.submissionId)
        throw new ValidationError('No submission attached to this evaluation — start the evaluation again')

    const assignment = await getAssignmentWithSheet(evalAssignment.assignmentId)
    const sections = assignment?.evalSheet?.sections ?? []
    if(sections.length === 0)
        throw new NotFoundError('This assignment has no eval sheet')

    const sectionsById = new Map(sections.map(s => [s.id, s]))
    if(scores.length !== sections.length)
        throw new ValidationError('Every section must be scored exactly once')

    const seen = new Set()
    for(const {sectionId, score} of scores){
        const sectionIdInt = parseInt(sectionId)
        const scoreInt = parseInt(score)
        const section = sectionsById.get(sectionIdInt)
        if(!section)
            throw new ValidationError(`Section ${sectionId} does not belong to this eval sheet`)
        if(seen.has(sectionIdInt))
            throw new ValidationError(`Section ${sectionId} was scored more than once`)
        seen.add(sectionIdInt)
        if(isNaN(scoreInt) || scoreInt < 0 || scoreInt > section.marks)
            throw new ValidationError(`Score for "${section.name}" must be between 0 and ${section.marks}`)
        if(section.sectionType === 'Toggle' && scoreInt !== 0 && scoreInt !== section.marks)
            throw new ValidationError(`"${section.name}" is a yes/no section — score must be 0 or ${section.marks}`)
    }

    const givenMarks = scores.reduce((sum, s) => sum + parseInt(s.score), 0)

    const response = await prisma.evalResponse.create({
        data: {
            subId: evalAssignment.submissionId,
            userId: evaluatorUserIdInt,
            givenMarks,
            comment,
            scores: { create: scores.map(s => ({ sectionId: parseInt(s.sectionId), score: parseInt(s.score) })) }
        },
        include: { scores: true }
    })

    await prisma.evalAssignment.update({
        where: { id: evalAssignment.id },
        data: { status: 'Submitted', evalResponseId: response.id }
    })

    return response
}

// get all eval feedback (EvalResponse rows) left on one submission
const getEvalResponsesForSubmission = async (subId) => {
    const subIdInt = parseInt(subId)
    if(!subIdInt)
        throw new ValidationError('Invalid submission id')

    return await prisma.evalResponse.findMany({
        where: { subId: subIdInt },
        select: {
            id: true, isStaffReview: true, givenMarks: true, comment: true, reply: true, rating: true, userId: true,
            user: { select: { id: true, username: true } },
            scores: { select: { id: true, sectionId: true, score: true,
                       section: { select: { id: true, name: true, description: true, marks: true, sectionType: true } } } }
        },
        orderBy: { id: 'asc' }
    })
}

// recomputes a submission's finalScore/passed from the avg of givenMarks across replied-to EvalResponses
const recomputeFinalScore = async (subId) => {
    const replied = await prisma.evalResponse.findMany({
        where: { subId, reply: { not: null } },
        select: { givenMarks: true }
    })

    if(replied.length === 0){
        await prisma.submission.update({ where: { id: subId }, data: { finalScore: null, passed: null } })
        return
    }

    const avg = replied.reduce((sum, r) => sum + r.givenMarks, 0) / replied.length

    const submission = await prisma.submission.findUnique({
        where: { id: subId },
        include: { group: { include: { assignment: true } } }
    })
    const assignment = submission.group.assignment
    const passed = assignment.max_score > 0 && (avg / assignment.max_score) * 100 >= assignment.pass_threshold

    await prisma.submission.update({ where: { id: subId }, data: { finalScore: avg, passed } })
}

// the group leader replies to one piece of eval feedback — once replied, its marks count toward the final grade
const replyToEvalResponse = async (responseId, { userId, reply }) => {
    const responseIdInt = parseInt(responseId)
    const userIdInt = parseInt(userId)
    if(!responseIdInt || !userIdInt || !validateString(reply))
        throw new ValidationError('userId and reply are required')

    const response = await prisma.evalResponse.findUnique({
        where: { id: responseIdInt },
        include: { submission: { include: { group: true } } }
    })
    if(!response)
        throw new NotFoundError('Eval response not found')
    if(response.submission.group.leaderId !== userIdInt)
        throw new UnauthorizedError('Only the group leader can reply to this feedback')
    if(response.reply)
        throw new ConflictError('This feedback has already been replied to')

    const updated = await prisma.evalResponse.update({
        where: { id: responseIdInt },
        data: { reply }
    })

    await recomputeFinalScore(response.subId)

    return updated
}

module.exports = {getEvalSheetById, getEvalSheetByAssId, getAssignment, createEvalSheet, createEvalSection,
    updateEvalSheetSection, removeSection,
    getEvalAssignments, deleteEvalAssignments, getEvalAssignmentById, createEvalAssignment,
    updateEvalAssignment, deleteEvalAssignment, generateSimpleEvalAssignmentPairings,
    startEvaluation, submitEvaluation, getEvalResponsesForSubmission, replyToEvalResponse
}