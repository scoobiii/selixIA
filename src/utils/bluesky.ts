import dotenv from "dotenv";
dotenv.config();

export interface BlueskyPostResult {
  uri: string;
  cid: string;
}

/**
 * Log in to Bluesky and get a valid session.
 */
export async function loginBluesky(): Promise<{ accessJwt: string; did: string } | null> {
  const username = process.env.BLUESKY_USERNAME;
  const password = process.env.BLUESKY_APP_PASSWORD;

  if (!username || !password || username === "MY_BLUESKY_USERNAME" || password === "MY_BLUESKY_APP_PASSWORD") {
    console.log("📡 [BLUESKY] Credentials not configured in .env. Skipping real connection; using simulation only.");
    return null;
  }

  try {
    const res = await fetch("https://bsky.social/xrpc/com.atproto.server.createSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: username.trim(),
        password: password.trim()
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ [BLUESKY] Session creation failed (Status: ${res.status}):`, errText);
      return null;
    }

    const data = await res.json() as { accessJwt: string; did: string };
    console.log("✅ [BLUESKY] Authenticated successfully with DID:", data.did);
    return { accessJwt: data.accessJwt, did: data.did };
  } catch (err) {
    console.error("❌ [BLUESKY] Authentication Exception:", err);
    return null;
  }
}

/**
 * Publish an array of strings as a threaded reply cascade on Bluesky.
 */
export async function publishThreadToBluesky(posts: string[]): Promise<BlueskyPostResult[] | null> {
  const session = await loginBluesky();
  if (!session) return null;

  const { accessJwt, did } = session;
  const results: BlueskyPostResult[] = [];

  try {
    let rootRef: BlueskyPostResult | null = null;
    let parentRef: BlueskyPostResult | null = null;

    for (let i = 0; i < posts.length; i++) {
      const rawText = posts[i];
      if (!rawText || !rawText.trim()) continue;

      // Ensure post complies with AT协议 limit of 300 characters or length
      const text = rawText.trim().substring(0, 300);

      const postBody: any = {
        $type: "app.bsky.feed.post",
        text: text,
        createdAt: new Date().toISOString()
      };

      // Set up response references for correct thread styling on Bluesky interface
      if (rootRef && parentRef) {
        postBody.reply = {
          root: { uri: rootRef.uri, cid: rootRef.cid },
          parent: { uri: parentRef.uri, cid: parentRef.cid }
        };
      }

      console.log(`📡 [BLUESKY] Publishing post ${i + 1}/${posts.length}...`);
      const res = await fetch("https://bsky.social/xrpc/com.atproto.repo.createRecord", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessJwt}`
        },
        body: JSON.stringify({
          repo: did,
          collection: "app.bsky.feed.post",
          record: postBody
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Post ${i + 1} creation failed (HTTP ${res.status}): ${errText}`);
      }

      const data = await res.json() as { uri: string; cid: string };
      const currentRef = { uri: data.uri, cid: data.cid };

      if (i === 0) {
        rootRef = currentRef;
      }
      parentRef = currentRef;
      results.push(currentRef);
    }

    console.log(`🎉 [BLUESKY] Successfully posted thread of ${results.length} blocks!`);
    return results;
  } catch (err) {
    console.error("❌ [BLUESKY] Failed to publish cascade:", err);
    return null;
  }
}
