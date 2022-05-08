import NextAuth from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';
import GitHubProvider from 'next-auth/providers/github';
import { config } from '../../../../config';

export async function refreshAccessToken(token) {
  const { refresh_token } = token;

  if (!refresh_token) {
    return token;
  }

  try {
    const url = 'https://api.twitter.com/2/oauth2/token';

    const confidentialClientAuthHeader = Buffer.from(
      `${config.TWITTER_CLIENT_ID}:${config.TWITTER_CLIENT_SECRET}`,
    ).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token,
        client_id: config.TWITTER_CLIENT_ID,
      }),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${confidentialClientAuthHeader}`,
      },
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }
    return {
      ...token,
      access_token: refreshedTokens.access_token,
      refresh_token: refreshedTokens.refresh_token ?? token.refresh_token,
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in ?? 0) * 1000,
    };
  } catch (error) {
    console.error({ error });

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

export default NextAuth({
  callbacks: {
    session({ session, token }) {
      return { ...session, ...token };
    },
    async jwt({ token, account = {}, profile }) {
      const { provider } = account;

      if (provider) {
        token[provider] = { provider };
      }

      if (provider === 'twitter') {
        const { username } = profile?.data;
        token[provider].username = username;
      }

      if (account && profile) {
        const { refresh_token, access_token, expires_at } = account;

        const accessTokenExpires = expires_at * 1000;

        return {
          ...token,
          [account.provider]: {
            access_token,
            refresh_token,
            accessTokenExpires,
          }
        };
      }

      if (Date.now() < (token.accessTokenExpires ?? 0)) {
        return token;
      }

      return await refreshAccessToken(token);
    },
  },
  providers: [
    TwitterProvider({
      clientId: config.TWITTER_CLIENT_ID,
      clientSecret: config.TWITTER_CLIENT_SECRET,
      version: '2.0',
      authorization: {
        url: 'https://twitter.com/i/oauth2/authorize',
        params: {
          scope: 'users.read tweet.read tweet.write offline.access',
        },
      },
      token: {
        async request({ client, params, checks, provider }) {
          const response = await client.oauthCallback(
            provider.callbackUrl,
            params,
            checks,
            { exchangeBody: { client_id: config.TWITTER_CLIENT_ID } }
          )
          return { tokens: response }
        }
      },
    }),
    GitHubProvider({
      clientId: config.GITHUB_CLIENT_ID,
      clientSecret: config.GITHUB_CLIENT_SECRET,
      version: '3',
    }),
  ],
});
