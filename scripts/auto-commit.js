const simpleGit = require('simple-git');
const git = simpleGit();

async function autoCommit() {
  try {
    const status = await git.status();
    if (status.files.length > 0) {
      await git.add('.');
      const timestamp = new Date().toISOString().split('T')[0];
      await git.commit(`Auto-commit: ${timestamp} - ${status.files.length} files changed`);
      console.log('✓ Changes committed automatically');
      
      // Try to push
      try {
        await git.push();
        console.log('✓ Pushed to GitHub');
      } catch (e) {
        console.log('⚠️  Could not push - run "npm run push" when ready');
      }
    } else {
      console.log('ℹ️  No changes to commit');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

autoCommit();