import ytSearch from 'yt-search';
import youtubedl from 'youtube-dl-exec';
import axios from 'axios';

async function test() {
  try {
    console.log('Searching...');
    const searchResult = await ytSearch('blinding lights');
    const video = searchResult.videos[0];
    console.log('Found:', video.title);
    
    console.log('Getting JSON...');
    const info = await youtubedl(video.url, {
      dumpSingleJson: true,
      noCheckCertificates: true,
      noWarnings: true,
      preferFreeFormats: true
    });
    
    // Find best audio format
    const audioFormats = info.formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
    const bestAudio = audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
    
    console.log('Direct URL:', bestAudio.url);
    console.log('Format:', bestAudio.ext);

    // Test downloading a tiny bit
    const response = await axios.get(bestAudio.url, { responseType: 'stream' });
    response.data.on('data', chunk => {
        console.log(`Received ${chunk.length} bytes`);
        process.exit(0);
    });

  } catch (e) {
    console.error('Catch Error:', e);
  }
}

test();
