const express = require('express');
const WordModel = require('../models/word');
const GameModel = require("../models/game");

const Router = express.Router();

const isLogged = (request, response, next) => {
    if (request.session.user) {
        console.log('test');
        next();
    } else {
        return response.status(500).json({'msg': "not logged !"})
    }
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

    try {
        await game.save();

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

Router.post('/verif', isLogged, (request, response) => {
    console.log(request.session.word);

   let search = request.session.word;
   let guess = request.body.word

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

    if (guess === search) {
        return response.status(200).json({
            "result": "You find the word !"
        });
    }

    return response.status(500).json({
        "result": "You don't find the word !"
    });
});

module.exports = Router;
