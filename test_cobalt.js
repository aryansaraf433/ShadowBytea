import axios from 'axios';

async function test() {
  try {
    const response = await axios.post('https://api.cobalt.tools/api/json', {
      url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
      isAudioOnly: true,
      aFormat: 'mp3'
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Origin': 'https://cobalt.tools',
        'Referer': 'https://cobalt.tools/'
      }
    });
    console.log('Cobalt Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

test();
