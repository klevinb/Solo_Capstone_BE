const axios = require('axios');
const fs = require('fs-extra');
const { join } = require('path');
const pdfMakePrinter = require('pdfmake');

const fonts = {
  Roboto: {
    normal: 'node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf',
    bold: 'node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf',
    italics: 'node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf',
    bolditalics:
      'node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf',
  },
};
const printer = new pdfMakePrinter(fonts);

const generatePdf = async (url, filename, event) => {
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
        bold: true,
        fontSize: 30,
        marginBottom: 30,
      },
      {
        text: event.name,
        bold: true,
        fontSize: 15,
        marginBottom: 30,
      },

      {
        image: 'event',
        width: 510,
        marginBottom: 50,
      },
      {
        image: 'logo',
        width: 100,
        height: 80,
        absolutePosition: { x: 500, y: 5 },
      },
      {
        columns: [
          {
            text: `Organizer : ${event.organizer}
            Performer : ${event.performer}
            `,
            fontSize: 20,
            width: 250,
          },
          {
            width: '*',
            text: `Date : ${event.startDate.toString().slice(0, 10)}
            Description : ${event.description}
            `,
            fontSize: 20,
          },
        ],
        // optional space between columns
        columnGap: 10,
      },
    ],
    images: {
      logo: logoData,
      event: image,
    },
  };
  pdfDoc = printer.createPdfKitDocument(docDefinition);
  pdfDoc.pipe(
    fs.createWriteStream(join(__dirname, `../../assets/pdf/${filename}.pdf`))
  );
  pdfDoc.end();
  const pdfData = join(__dirname, `../../assets/pdf/${filename}.pdf`);
  return pdfData;
};

module.exports = {
  generatePdf,
};
