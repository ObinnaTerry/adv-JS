const express = require('express');
const Router = express.Router();

const WordModel = require('../models/word');

const isLogged = (request, response, next) => {
    if (request.session.user) {
        console.log('test');
        next();
    } else {
        return response.status(401).json({'msg': "not logged !"})
    }
}

Router.post('/', isLogged, async (request, response) => {

    const { word } = request.body;

    const wordModel = new WordModel({ 
        name: word
    });

    try {

        await wordModel.save();

        return response.status(200).json({
            "msg": word
        });

    } catch (error) {
        return response.status(500).json({
            "error": error.message
        });
    }
});

Router.delete('/', isLogged, async (request, response) => {
    const { word } = request.body;
  
    try {
      const result = await WordModel.deleteOne({ name: word });
  
      if (result.deletedCount === 1) {
        return response.status(200).json({
          "msg": `Successfully deleted the word: ${word}`
        });
      } else {
        return response.status(404).json({
          "error": `Word not found: ${word}`
        });
      }
    } catch (error) {
      return response.status(500).json({
        "error": error.message
      });
    }
  });

  Router.put('/:id', isLogged, async (request, response) => {
    const { id } = request.params;
    const { word } = request.body;
  
    try {
      const result = await WordModel.findByIdAndUpdate(id, { name: word });
  
      if (result) {
        return response.status(200).json({
          "msg": `Successfully updated the word: ${word}`
        });
      } else {
        return response.status(404).json({
          "error": "Word not found"
        });
      }
    } catch (error) {
      return response.status(500).json({
        "error": error.message
      });
    }
  });
  
  Router.delete('/:id', isLogged, async (request, response) => {
    const { id } = request.params;
  
    try {
      const result = await WordModel.findByIdAndDelete(id);
  
      if (result) {
        return response.status(200).json({
          "msg": "Successfully deleted the word"
        });
      } else {
        return response.status(404).json({
          "error": "Word not found"
        });
      }
    } catch (error) {
      return response.status(500).json({
        "error": error.message
      });
    }
  });

  Router.get('/:id', isLogged, async (request, response) => {
    const { id } = request.params;
  
    try {
      const word = await WordModel.findById(id);
  
      if (word) {
        return response.status(200).json(word);
      } else {
        return response.status(404).json({
          "error": "Word not found"
        });
      }
    } catch (error) {
      return response.status(500).json({
        "error": error.message
      });
    }
  });


module.exports = Router;