import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function hidemap(req: NextApiRequest, res: NextApiResponse) {
  // Destructure the query parameters from the request
  const { z, x, y } = req.query;

  // Ensure query parameters are strings before proceeding
  if (typeof z === 'string' && typeof x === 'string' && typeof y === 'string') {
    console.log(`Proxy request received for ${z}/${x}/${y}.png`); // Debugging line to log the request details

    try {
      // Make a request to the Geoapify tile service to fetch the requested tile
      const response = await axios.get(
        `https://maps.geoapify.com/v1/tile/osm-carto/${z}/${x}/${y}.png?apiKey=${process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY}`, 
        { responseType: 'arraybuffer' } // Set response type to arraybuffer for image data
      );

      // Set the response header to indicate the content type is an image
      res.setHeader('Content-Type', 'image/png');

      // Send the image data received from Geoapify to the client
      res.send(response.data);
    } catch (error) {
      // Log any errors that occur during the request
      console.error("Error fetching tile:", error);
      res.status(500).send("Error fetching tile");
    }
  } else {
    res.status(400).send("Invalid parameters");
  }
}
