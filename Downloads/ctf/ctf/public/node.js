const fs = require('fs');
const { PNG } = require('pngjs');

// Function to encode a flag into an image using LSB substitution
function encodeFlagIntoImage(flag, imagePath, outputImagePath) {
    // Read the input image
    fs.createReadStream(imagePath)
        .pipe(new PNG({ filterType: 4 }))
        .on('parsed', function() {
            const flagBinary = Buffer.from(flag).toString('binary');
            let flagIndex = 0;

            // Iterate through each pixel and modify the LSB
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const idx = (this.width * y + x) << 2;
                    if (flagIndex < flagBinary.length) {
                        const pixel = this.data[idx];
                        const newPixel = (pixel & 0xFE) | parseInt(flagBinary[flagIndex], 2);
                        this.data[idx] = newPixel;
                        flagIndex++;
                    } else {
                        break;
                    }
                }
            }

            // Save the modified image with the flag
            this.pack().pipe(fs.createWriteStream(outputImagePath));
        });
}

// Function to decode the flag from an image
function decodeFlagFromImage(imagePath) {
    let flagBinary = '';
    // Read the input image
    fs.createReadStream(imagePath)
        .pipe(new PNG({ filterType: 4 }))
        .on('parsed', function() {
            // Iterate through each pixel and extract the LSB
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const idx = (this.width * y + x) << 2;
                    flagBinary += (this.data[idx] & 1);
                }
            }
            // Convert the binary flag to ASCII
            const flag = Buffer.from(flagBinary, 'binary').toString();
            console.log('Decoded Flag:', flag);
        });
}

// Example usage
const flag = 'FLAG{your_flag_here}';
const imagePath = 'original_image.png';
const outputImagePath = 'encoded_image.png';

// Encode flag into the image
encodeFlagIntoImage(flag, imagePath, outputImagePath);

// Decode flag from the image
decodeFlagFromImage(outputImagePath);
