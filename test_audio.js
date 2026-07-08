import play from 'play-dl';

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
    
    const chunks = [];
    let downloaded = 0;
    
    stream.stream.on('data', (chunk) => {
      chunks.push(chunk);
      downloaded += chunk.length;
      console.log(`Downloaded: ${(downloaded / 1024 / 1024).toFixed(2)} MB`);
    });

    stream.stream.on('end', () => {
      console.log('Finished downloading completely!');
      console.log('Total size:', (downloaded / 1024 / 1024).toFixed(2), 'MB');
      process.exit(0);
    });

    stream.stream.on('error', (err) => {
      console.error('Stream Error:', err);
      process.exit(1);
    });

  } catch (e) {
    console.error('Catch Error:', e);
  }
}

test();
