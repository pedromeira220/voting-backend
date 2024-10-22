import express from "express"
import { prisma } from "./lib/prisma"

const PORT = 3333

const app = express()

app.use(express.json())

app.post("/option", async (req, res) => {
   const { name } = req.body

   if(!name) {
    return res.status(422).json({
        error: "Name é obrigatório"
    })
   }

   const defaultVoting = await prisma.voting.findFirst({
        where: {
            name: "default"
        }
   })

   let votingId: null | string = null

   if(!defaultVoting?.id) {
    const createdVoting = await prisma.voting.create({
        data: {
            name: "default"
        }
    })

    votingId = createdVoting.id
   } else {
    votingId = defaultVoting.id
   }

   await prisma.option.create({
        data: {
            name,
            votingId
        }
   })

   return res.status(200).json({
        msg: "Option created"
   })
})

app.post("/vote/:optionId", async (req, res) => {
    const { participantName } = req.body
    const optionId = req.query
 
    if(!participantName) {
     return res.status(422).json({
         error: "participantName é obrigatório"
     })
    }

    if(!optionId) {
        return res.status(422).json({
            error: "optionId é obrigatório"
        })
       }
 
    const option = await prisma.option.findFirst({
         where: {
             id: optionId
         }
    })

    if(!option) {
        return res.status(404).json({
            error: "Opção não encontrada"
        }) 
    }
 
    await prisma.vote.create({
         data: {
             participantName,
             optionId: option.id
         }
    })
 
    return res.status(200).json({
         msg: "Vote saved"
    })
 })

 app.get("/voting/metrics", async (req, res) => {

    const voting = await prisma.voting.findFirst({
        where: {
            name: "default"
        }
    })

    if(!voting) {
        return res.status(404).json({
            error: "Voting não encontrado"
        })
    }
    
    const voteCounts = await prisma.option.groupBy({
        by: ['id', 'name'],
        where: {
          votingId: voting.id,
        },
        _count: {
          id: true
        },
      });
 
    return res.status(200).json({
        result: voteCounts.map(option => ({
            id: option.id,
            name: option.name,
            voteCount: option._count.id,
          }))
    })
 })


app.listen(PORT, () => {
    console.log(`> Server running on port ${PORT}`);  
})