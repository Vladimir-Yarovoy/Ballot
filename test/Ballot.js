const { expect } = require('chai');
const { ethers, waffle } = require('hardhat');

  
describe('lesson1 contact', () => {

    beforeEach(async () => {

        [owner, addr1, addr2] = await ethers.getSigners()
        contractInstance = await ethers.getContractFactory("Ballot")
        names = ["hello","world","go buhat"]
        ballot = await contractInstance.deploy(names)
        await ballot.deployed()  
    });
    
    it('Proposals and names amounts are equal', async () => {
        const proposals = await ballot.proposalsAll()
        expect(proposals.length).to.equal(names.length)
    });
   
    // TODO: сформулировать проверяемое свойство
    it('The proposals names correspond to the names of the deployment', async () => {
        const proposals = await ballot.proposalsAll()
        for (i = 0; i < proposals.length; i ++) {
            expect(proposals[i].name).to.equal(names[i])
        } 
    });

    describe('Test function giveRightToVote', () => {

        it('Owner is able give to vote others', async () => {

            voter = await ballot.getVoter(addr1.address)
            expect(voter.weight).to.equal(0)
            await ballot.connect(owner).giveRightToVote(addr1.address)
            voter = await ballot.getVoter(addr1.address)
            expect(voter.weight).to.equal(1)
        });

        it('Non-owner is not able give to vote others', async () => {
            await expect (ballot.connect(addr1).giveRightToVote(addr2.address)).to.be.revertedWith("Only chairperson can give right to vote.")
        });

        it('It is impossible to give more than one vote to one address', async () => {
            await ballot.connect(owner).giveRightToVote(addr1.address)
            await expect (ballot.connect(owner).giveRightToVote(addr1.address)).to.be.reverted
        });

    });

    describe('Test function delegate', () => {

        it('There is an opportunity to delegate', async () => {
            await ballot.delegate(addr1.address)
            voter = await ballot.getVoter(owner.address)
            expect (voter.delegate).to.eq(addr1.address)
        });

        it('There is NOT an opportunity to delegate', async () => {
            await expect (ballot.connect(addr1).delegate(owner.address)).to.be.revertedWith("Has no right to delegate.");
        });

        it('There is NOT an opportunity to delegate, if already voted', async () => {
            await ballot.vote(1)
            await expect (ballot.delegate(addr1.address)).to.be.revertedWith("You already voted.")
        });

        it('There is NOT an opportunity to delegate to myself', async () => {
            await expect (ballot.delegate(owner.address)).to.be.revertedWith("Self-delegation is disallowed.");
        });

        it('There is NOT an opportunity to delegate back', async () => {
            await ballot.delegate(addr1.address)
            await ballot.giveRightToVote(addr1.address)
            await expect (ballot.connect(addr1).delegate(owner.address)).to.be.revertedWith("Found loop in delegation.");
        });

    });

    describe('Test function vote', () => {

        it('There is an opportunity to vote', async () => {
            await ballot.vote(1)
            voter = await ballot.getVoter(owner.address)
            expect (voter.voted).to.eq(true)
        });

        it('There is NOT an opportunity to vote', async () => {
            await expect (ballot.connect(addr1).vote(0)).to.be.revertedWith("Has no right to vote")
        });

        it('There is NOT an opportunity to vote twice', async () => {
            await ballot.vote(1)
            voter = await ballot.getVoter(owner.address)
            expect (voter.voted).to.eq(true)
            await expect (ballot.vote(1)).to.be.revertedWith("Already voted.")
        });

    });

    describe('Test function voteByProxy', () => {

        it('There is an opportunity to vote', async () => {
            await ballot.giveRightToVote(addr1.address)
            await ballot.connect(addr1).delegate(owner.address)
            await ballot.voteByProxy(addr1.address, 1)
            voter = await ballot.getVoter(addr1.address)
            expect (voter.voted).to.eq(true)
            expect (voter.votedMyself).to.eq(false)
        });

        it('Use function "vote", if to vote myself', async () => {
            await expect (ballot.connect(owner).voteByProxy(owner.address, 0)).to.be.revertedWith("Use function 'vote' for vote")
        });

        it('There is NOT an opportunity to vote twice from the same address', async () => {
            await ballot.delegate(addr1.address)
            await ballot.vote(1)
            await expect (ballot.connect(addr1).voteByProxy(owner.address, 1)).to.be.revertedWith("Already voted.")
        });

        it('There is NOT an opportunity to vote from another address', async () => {
            await expect (ballot.voteByProxy(addr1.address, 1)).to.be.revertedWith("Opportunity to vote was not delegated")
        });

    });

    describe('Test winner functions', () => {

        it('Winner results (proposal number)', async () => {
            await ballot.vote(0)
            proposals = await ballot.proposalsAll()
            winnerProposal = await ballot.winningProposal()
            expect(proposals[winnerProposal].voteCount).to.equal(1)
        });


        it('Winner results (proposal name and vote count)', async () => {
            await ballot.vote(0)
            winnerNameAndCount = await ballot.winner()
            expect(winnerNameAndCount.name).to.equal(names[0])
            expect(winnerNameAndCount.winnerVoteCount_).to.equal(1)
        });

    });
});