const { prisma } = require("../../database");
const utils = require("../src/classUtils")
const {NotFoundError} = require("../../errors")
const {ValidationError} = require('../../errors')


const getEvalSheetById = async(id, select = null, include = null)=>{
    const options = {where:{id: parseInt(id)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.evalSheet.findUnique(options)
}

const getEvalSheetByAssId = async(assId, select = null)=>{
    return await utils.getAssignmentById(assId, select, {evalSheet:true})
}


// methods pertaining to EvalAssignment model/table:

const getEvalAssignments = async (assignmentId, select = null, include = null) => {
  if (!assignmentId || isNaN(assignmentId))
    throw new ValidationError('Invalid assignment ID');
  const options = {where: { assignmentId: parseInt(assignmentId)}}
  if (select)
    options.select = select
  if (include)
    options.include = include
  return await prisma.evalAssignment.findMany(options)
}

const getEvalAssignmentById = async (id, select = null, include = null) => {
  if (!id || isNaN(id))
    throw new ValidationError('Invalid Eval-assignment ID');
  const options = {where: { id: parseInt(id) }}
  if (select)
    options.select = select
  if (include)
    options.include = include
  return await prisma.evalAssignment.findUnique(options)
}

module.exports = {getEvalSheetById, getEvalSheetByAssId,
                  getEvalAssignments, getEvalAssignmentById
}