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

module.exports = {getEvalSheetById, getEvalSheetByAssId, getAssignment, createEvalSheet, createEvalSection,
    updateEvalSheetSection, removeSection
}