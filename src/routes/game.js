const express = require('express');
const WordModel = require('../models/word');
const GameModel = require("../models/game");
const game = require('../models/game');
const session = require('express-session');

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

  function setDifficulty(request){
    let result = true;
    
    if(request.body.difficulty === 'hard'){
        request.session.difficulty = 3;
    }
    else if(request.body.difficulty === 'medium'){
        request.session.difficulty = 5;
    }
    else if(request.body.difficulty === 'easy'){
        request.session.difficulty = 8;
    }
    else{
        return false;
    }

    return result;
  }
  

Router.post('/', isLogged, async (request, response) => {

    if (!setDifficulty(request)){
        return response.status(400).json({
            "msg": "You must set game difficulty before playing"
        }); 
    }

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
            "msg": "The secret word has a length of " + word[0].name.length
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

    if(typeof request.session.word === 'undefined'){
        return response.status(403).json({
            "msg": "You must create a game before playing"
        });
    }

    if(request.session.difficulty === 0){
        return response.status(500).json({
            "result": "You Lost !",
            "tries": request.session.tries
        });
    }

    request.session.difficulty -= 1;

   let search = request.session.word;
   let guess = request.body.word
   request.session.tries.push(guess);

    if(search.length !== guess.length){
        return response.status(500).json({
            "msg": "Your 'word' value must be " + search.length,
            "attempts left": request.session.difficulty,
        });
    }

    if (typeof guess === 'undefined') {
        return response.status(500).json({
            "msg": "You have to send 'word' value"
        });
    }

    let result = guessWord(guess, search);

    if (guess === search) {
        return response.status(200).json({
            "result": "You Won !",
            "attempts left": request.session.difficulty,
            "guess": guess,
            "accuracy": result,
            "tries": request.session.tries
        });
    }
    
    return response.status(500).json({
        "result": "You don't find the word !",
        "attempts left": request.session.difficulty,
        "guess": guess,
        "accuracy": result,
        "tries": request.session.tries
    });
});

module.exports = Router;