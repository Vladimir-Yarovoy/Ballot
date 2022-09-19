// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.0 <0.9.0;

contract Ballot {

    struct Voter {
        uint8 weight; // weight is accumulated by delegation
        bool voted;  // if true, that person already voted
        address delegate; // person delegated to
        uint vote;   // index of the voted proposal
        bool votedMyself;
    }

    struct Proposal {
        string name;   
        uint voteCount; // number of accumulated votes
    }

    address public chairperson;

    mapping(address => Voter) public voters;

    Proposal[] public proposals;

    constructor(string[] memory proposalNames) {
        chairperson = msg.sender;
        voters[chairperson].weight = 1;

        for (uint i = 0; i < proposalNames.length; i++) {

            proposals.push(Proposal({
                name: proposalNames[i],
                voteCount: 0
            }));
        }
    }


   function giveRightToVote(address voter) external {

      require(
      msg.sender == chairperson,
      "Only chairperson can give right to vote."
       );
     require(
       !voters[voter].voted,
         "The voter already voted."
       );
      require(voters[voter].weight == 0);
    voters[voter].weight = 1;
   }

    function delegate(address to) external {

        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "Has no right to delegate.");
        require(!sender.voted, "You already voted.");
        require(to != msg.sender, "Self-delegation is disallowed.");

        while (voters[to].delegate != address(0)) {
            to = voters[to].delegate;
            require(to != msg.sender, "Found loop in delegation.");
        }

        sender.delegate = to;

    }

    function vote(uint proposal) external {
        Voter storage sender = voters[msg.sender];
        require(sender.weight != 0, "Has no right to vote");
        require(!sender.voted, "Already voted.");
        sender.voted = true;
        sender.vote = proposal;
        sender.votedMyself = true;
        proposals[proposal].voteCount += 1;
    }

    function voteByProxy(address addressbyProxy, uint proposal) external {
        Voter storage voterByProxy = voters[addressbyProxy];
        require(addressbyProxy != msg.sender, "Use function 'vote' for vote");
        require(!voterByProxy.voted, "Already voted.");
        require(voterByProxy.delegate == msg.sender, "Opportunity to vote was not delegated");
        voterByProxy.voted = true;
        voterByProxy.vote = proposal;
        proposals[proposal].voteCount += 1;
    }


/*function proposalsAll() public view returns (Proposal[] memory, uint) {
        return (proposals, proposals.length);

    }
*/

function proposalsAll() public view returns (Proposal[] memory) {
        return proposals;
    }

function getVoter(address voter) public view returns (Voter memory) {
        return voters[voter]; // new Voter (voters[voter]) --> new Voter(undefined)
    }


    // SOLID, d - dependency inversion (see dependency injection in OOP languages)

    function winningProposal() public view
            returns (uint winningProposal_)
    {
        uint winningVoteCount = 0;
        for (uint p = 0; p < proposals.length; p++) {
            if (proposals[p].voteCount > winningVoteCount) {
                winningVoteCount = proposals[p].voteCount;
                winningProposal_ = p;
            }
        }
    }

  function winner() public view
        returns (string memory name, uint winnerVoteCount_) {
            name = proposals[winningProposal()].name;
            winnerVoteCount_ = proposals[winningProposal()].voteCount;
        }

}