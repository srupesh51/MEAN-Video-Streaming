const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');
const autoIncrement = require('mongoose-auto-increment');

const Schema = mongoose.Schema;
autoIncrement.initialize(mongoose);

const videoSchema = new Schema({
  VideoID: { type: Number, required: true, unique: true },
  VideoTitle: { type: String, required: true },
  VideoType: { type: String, required: true },
  VideoFile: { type: String, required: true },
  VideoLink: { type: String, required: true },
  VideoHash: { type: String, required: true },
  createdOn: { type: Date, default: Date.now },
}, { collection: 'Videos' });


videoSchema.plugin(uniqueValidator);
videoSchema.plugin(autoIncrement.plugin, { model: 'videoModel', field: 'VideoID', startAt: 500000, incrementBy: 1 });


const videoModel = mongoose.model('Videos', videoSchema);

module.exports = videoModel;
