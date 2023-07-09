const fs = require("fs");
const https = require("https");

// Random image API
const random_image = "https://picsum.photos/96/96";


// Download random image and save to image.jpg
const downloadRandomImage = function () {
  const file = fs.createWriteStream("image.jpg");
  const request = https.get(random_image, function (response) {
    response.pipe(file);
  });
};

downloadRandomImage();
