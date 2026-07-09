import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: process.env.MODEL,
      messages: [{ role: 'user', content: 'test' }]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Success:', response.data.choices[0].message.content);
  } catch (error) {
    console.error('Error:', error.response ? error.response.status : error.message);
    if (error.response) {
       console.error('Data:', error.response.data);
    }
  }
}
test();
