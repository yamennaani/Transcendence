const { prisma } = require('../../database')

const getAllOrgs = async(select = null)=>{
    const options = {}
    if(select)
        options.select = select

    return await prisma.organization.findMany(options)
}

const getOrgById = async (id, select = null, include = null)=>{
    const options = {where: {id: parseInt(id)}}
    if(select)
        options.select = select
    if(include)
        options.include = include
    return await prisma.organization.findUnique(options)
}

const searchOrg = async (email, name, select = null, include = null)=>{
    const filter = []
    if(email)
        filter.push({email})
    if(name)
        filter.push({name})
    if(filter.length === 0) return null
    const options = {where: {OR:filter}}
    
    if(include)
        options.include = include
    if(select)
        options.select = select
    return await prisma.organization.findFirst(options)
}

module.exports = {getAllOrgs, getOrgById, searchOrg}