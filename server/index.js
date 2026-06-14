import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

class OAuthServer extends EventEmitter {
  constructor() {
    super();
    this.app = express();
    this.app.use(cors());
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.get('/login', (req, res) => {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const redirectUri = process.env.GITHUB_REDIRECT_URI;
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user,repo,read:user`;
      res.redirect(githubAuthUrl);
    });

    this.app.get('/callback', async (req, res) => {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).send('No code provided');
      }

      try {
        const response = await axios.post('https://github.com/login/oauth/access_token', {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code: code,
        }, {
          headers: {
            Accept: 'application/json',
          },
        });

        const accessToken = response.data.access_token;

        if (accessToken) {
          this.emit('token_received', accessToken);
          res.send(`
            <html>
              <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #0d1117; color: #c9d1d9;">
                <h1 style="color: #58a6ff;">Authentication Successful!</h1>
                <p>You can now close this window and return to the application.</p>
                <script>
                  window.close();
                </script>
              </body>
            </html>
          `);
        } else {
          res.status(500).send('Failed to exchange code for token');
        }
      } catch (error) {
        console.error('OAuth Error:', error);
        res.status(500).send('Internal Server Error');
      }
    });
  }

  start(port = 3000) {
    this.server = this.app.listen(port, () => {
      console.log(`OAuth server running at http://localhost:${port}`);
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
  }
}

export default new OAuthServer();
