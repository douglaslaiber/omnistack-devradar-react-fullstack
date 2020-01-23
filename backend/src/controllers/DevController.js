const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const { findConnections, sendMessage } = require('../websocket');

module.exports = {
  async index(request, response) {
    const devs = await Dev.find();

    return response.json(devs);
  },

  async store(request, response) {
    const { github_username, techs, latitude, longitude } = request.body;
    
    let dev = await Dev.findOne({ github_username });

    if (!dev) {
      const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);
      
      const { name = login, avatar_url, bio } = apiResponse.data;
      
      const techsArray = parseStringAsArray(techs);
    
      const location = {
        type: 'Point',
        coordinates: [longitude, latitude]
      }
    
      dev = await Dev.create({
          github_username,
          name,
          avatar_url,
          bio,
          techs: techsArray,
          location
      });

      // Filtar as conexões que estão há 10km de distância e que o novo Dev tenha pelo menos umas das tecnologias filtradas.
      
      const sendSocketMessageTo = findConnections({ latitude, longitude }, techsArray);

      sendMessage(sendSocketMessageTo, 'new-dev', dev);
    }
    
    return response.json(dev);
  },

  async update(request, response) {
    const { github_username } = request.params
    const dev = await Dev.findOne({ github_username });

    const { name, bio, avatar_url, techs, latitude, longitude } = request.body
    
    if (dev) {
      const techsArray = parseStringAsArray(techs);
      const location = latitude && longitude ? {
        type: 'Point',
        coordinates: [longitude, latitude]
      } : undefined

      await dev.updateOne({
        name: (name ? name : dev.name),
        avatar_url: (avatar_url ? avatar_url : dev.avatar_url),
        bio: (bio ? bio : dev.bio),
        location: (location ? location : dev.location),
        techs: (techsArray ? techsArray : dev.techs)
      });
    }

    return response.json({ message: 'Updated successfuly', id: dev._id });
  },

  async destroy(request, response) {
    const { github_username } = request.params
    let dev = await Dev.findOne({ github_username });

    if (dev) {
      dev.remove();
    }

    return response.json({ message: 'Deleted successfuly' });
  },

};