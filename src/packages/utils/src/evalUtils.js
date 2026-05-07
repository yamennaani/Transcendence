const { prisma } = require("../../database");
const utils = require("../src/classUtils")
const {NotFoundError} = require("../../errors")
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


module.exports = {getEvalSheetById, getEvalSheetByAssId}