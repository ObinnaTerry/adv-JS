const express = require('express');
const WordModel = require('../models/word');
const GameModel = require("../models/game");
const game = require('../models/game');

const Router = express.Router();

const isLogged = (request, response, next) => {
    if (request.session.user) {
        console.log('test');
        next();
    } else {
        return response.status(500).json({'msg': "not logged !"})
    }
}

function guessWord(guess, target) {
    if (guess.length !== target.length) {
      throw new Error("Guess and target word must have the same length.");
    }
  
    let result = "";
  
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === target[i]) {
        result += "1";
      } else if (target.includes(guess[i])) {
        result += "0";
      } else {
        result += "X";
      }
    }
  
    return result;
  }
  

Router.post('/', isLogged, async (request, response) => {
    const word = await WordModel.aggregate([{
        $sample: {size: 1}
    }]);

    let game = new GameModel({
        word: word[0]._id,
        tries: [],
        user: request.session.user._id
    });

    request.session.word = word[0].name;
    request.session.tries = [];

    try {
        await game.save();
        request.session.gameId = game._id;

        game = await GameModel.find({
            _id: game._id
        }).populate('user').populate('word')

        return response.status(200).json({
            "msg": word[0].name.length
        });
    } catch (error) {
        return response.status(500).json({
            "error": error.message
        });
    }
});


Router.get('/:id', async (request, response) => {
    const {id} = request.params;

    try {
        const game = await GameModel.findOne({_id: id});

        return response.status(200).json({
            "msg": game
        });
    } catch (error) {
        return response.status(500).json({
            "error": error.message
        });
    }
});

Router.post('/verif', isLogged, async (request, response) => {
    console.log(request.session.word);

    if(request.session.word === 'undefined'){
        return response.status(403).json({
            "msg": "You must create a game before playing"
        });
    }

   let search = request.session.word;
   let guess = request.body.word
   request.session.tries.push(guess);

    // get the value from the user

    // ge the value searched by getting the game

    // make the verification

    // send the result

    if(search.length !== guess.length){
        return response.status(500).json({
            "msg": "Your 'word' value must be " + search.length
        });
    }

    if (typeof guess === 'undefined') {
        return response.status(500).json({
            "msg": "You have to send 'word' value"
        });
    }

    let result = guessWord(guess, search);

    if (result === search) {
        return response.status(200).json({
            "result": "You find the word !"
        });
    }
    let wonGame = await GameModel.find({
        _id: game._id
    }).populate('user').populate('word')
    
    wonGame.tries = request.session.tries;

    return response.status(500).json({
        "word": guess,
        "response": result,
        "game": wonGame
    });
});

module.exports = Router;
