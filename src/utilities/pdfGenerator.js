const axios = require('axios');
const fs = require('fs-extra');
const { join } = require('path');

const generatePdfWithPhoto = async (url) => {
  const imgData = await fs.readFile(join(__dirname, '../../assets/logo.png'));
  const logoData = 'data:image/png;base64,' + imgData.toString('base64');

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
  });
  const image = new Buffer(response.data, 'base64');
  const docDefinition = {
    content: [
      {
        text: 'Event details!',
        style: 'header',
        alignment: 'center',
      },
      {
        image: 'event',
        width: 510,
        absolutePosition: { x: 40, y: 100 },
      },
      {
        image: 'logo',
        width: 100,
        height: 100,
        absolutePosition: { x: 500, y: 5 },
      },
    ],
    images: {
      logo: logoData,
      event: image,
    },
  };
  return docDefinition;
};

const generatePdf = async () => {
  const imgData = await fs.readFile(join(__dirname, '../../assets/logo.png'));
  const logoData = 'data:image/png;base64,' + imgData.toString('base64');

  const docDefinition = {
    content: [
      {
        text: 'Event details!',
        style: 'header',
        alignment: 'center',
      },
      {
        image: 'logo',
        width: 100,
        height: 100,
        absolutePosition: { x: 500, y: 5 },
      },
    ],
    images: {
      logo: logoData,
    },
  };
  return docDefinition;
};

module.exports = {
  generatePdfWithPhoto,
  generatePdf,
};
