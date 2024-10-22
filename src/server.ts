import express from "express"
import { prisma } from "./lib/prisma"
import cors from 'cors'

const PORT = 3333

const app = express()

app.use(cors())

app.use(express.json())

app.post("/option", async (req, res) => {
    const { name } = req.body

    if (!name) {
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

    if (!defaultVoting?.id) {
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
    const {optionId} = req.params

    console.log("> optionId",optionId);
    

    if (!participantName) {
        return res.status(422).json({
            error: "participantName é obrigatório"
        })
    }

    if (!optionId) {
        return res.status(422).json({
            error: "optionId é obrigatório"
        })
    }

    const option = await prisma.option.findFirst({
        where: {
            id: optionId
        }
    })

    if (!option) {
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

    if (!voting) {
        return res.status(404).json({
            error: "Voting não encontrado"
        })
    }

    const optionsWithVoteCounts = await prisma.option.findMany({
        where: {
            votingId: voting.id,
        },
        select: {
            id: true,
            name: true,
            _count: {
                select: {
                    Vote: true,
                },
            },
        },
    });

    const totalVotes = await prisma.vote.count({
        where: {
            option: {
                votingId: voting.id
            }
        }
    })

    return res.status(200).json({
        votes: optionsWithVoteCounts.map(option => ({
            optionId: option.id,
            optionName: option.name,
            voteCount: option._count.Vote,
          })),
          totalVotes
    })

})

app.get("/voting/options", async (req, res) => {
    const voting = await prisma.voting.findFirst({
        where: {
            name: "default"
        }
    })

    if (!voting) {
        return res.status(404).json({
            error: "Voting não encontrado"
        })
    }

    const options = await prisma.option.findMany({
        where: {
            votingId: voting.id
        }
    })

    return res.status(200).json({
        options: options
    })
})


app.listen(PORT, () => {
    console.log(`> Server running on port ${PORT}`);
})