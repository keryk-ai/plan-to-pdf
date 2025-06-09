# Adding Your Satellite Image

## Step 1: Save Your Image
Save your satellite image (the Airport Road map you showed) to:
```
/Users/morganstern/plan-to-pdf/assets/images/airport-road-satellite.png
```

You can do this by:
1. Taking a screenshot of your map
2. Saving it as `airport-road-satellite.png` 
3. Placing it in the `assets/images/` folder

## Step 2: The image will automatically be used
The example is already configured to use this image path.

## Step 3: Run the generator
```bash
node example-with-satellite-image.js
```

## Supported Image Formats
- PNG (recommended)
- JPG/JPEG
- SVG
- GIF

## Tips for Best Results
- Use high resolution images (at least 800x600)
- PNG format works best for maps with text
- Make sure the image shows the work zone area clearly