import axios from 'axios';
import { NextApiRequest, NextApiResponse } from 'next';

const sendgeoapifydata = async (req: NextApiRequest, res: NextApiResponse) => {
  const { query } = req.query;

  const apiKey = process.env.GEOAPIFY_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key is missing.' });
  }

  try {
    const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${query}&apiKey=${apiKey}`;
    const response = await axios.get(url);
    const data = response.data;

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch suggestions. Please try again.' });
  }
};

export default sendgeoapifydata;
