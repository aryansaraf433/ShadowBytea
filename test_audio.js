import play from 'play-dl';
import fs from 'fs';

async function test() {
  try {
    await play.getFreeClientID().then((clientID) => {
        play.setToken({ soundcloud : { client_id : clientID } })
    })

    console.log('Searching Soundcloud...');
    const searchResult = await play.search('blinding lights', { source: { soundcloud: 'tracks' }, limit: 1 });
    const track = searchResult[0];
    
    console.log('Getting stream...');
    const stream = await play.stream(track.url);
    
    stream.stream.on('data', (chunk) => {
      console.log(`Received ${chunk.length} bytes from play-dl stream!`);
      process.exit(0);
    });

  } catch (e) {
    console.error('Catch Error:', e);
  }
}

test();
