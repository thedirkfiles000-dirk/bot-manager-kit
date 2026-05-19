# The Dirk Files
### Accumulated Platform Intelligence for PolyBuzz Creators
*by @TheDirkFiles*

---

This document captures hard-won knowledge about the PolyBuzz platform — how the filter works, how the algorithm behaves, what produces consistent bots, and what will get you shadowbanned before you know what happened. None of this is officially documented anywhere. It exists because someone had to learn it the hard way.

Entries are numbered in no particular order. The platform is also a moving target. Things that were once true might not be true today. 

**Note:** I use AI and LLM interchangeably. For the purposes of this document, they're the same thing most of the time.

---

## TDF #1 — Dialog vs Background

**Dialog examples calibrate voice, not facts.**

The LLM reads your Background to determine *who* a character is. It reads Dialog examples to determine *how* they sound. These are separate systems and they do not cross-pollinate.

If you want a character to have a specific trait, behavior, quirk, or compulsion — it must be stated in the Background (anchors, rp_rules, character_anchors). Demonstrating it only in dialog examples will not establish it as a persistent character fact.

I wrote a bot was built with four dialog examples showing Tourette's coprolalia (involuntary profanity). In the background, it was merely stated that the character had Tourette's. In test runs, the character was described as having motor tics — the most common presentation of the condition. The Dialog Examples did not inform the LLM of the type of Torette's the character had, so it defaulted to the most common kind. I changed the background and specified (using clinical words) exactly the sort of Tourette's the character had. Now the involuntary swearing happened - and now the Dialog Examples formatted how the swearing was rendered. 

**Rule:** Dialog examples are voice calibration. Character facts live in Background. 

---

## TDF #2 — British vs American Vocabulary

**PB's filter has a blind spot for British profanity.**

American anatomical terms fail both the upload filter (scan on save) and the generation filter (scan on LLM output). British equivalents pass both freely and generate cleanly in output.

**The dash trick** (C-CK) clears the upload filter but the generation filter still sanitizes the output. British vocabulary is the only reliable end-to-end workaround.

**Rule:** Write British. It works on both ends. It also sounds classier. This will work until PolyBuzz catches on or until Google spots it and complains.

---

## TDF #3 — The Filter System

**The filter is two levels, not two filters. The first is fast and can be fooled. The second is slow and can't.**

PB's content moderation runs in two levels, both of which can land you in trouble. They're not separate systems with different rules — they're two passes at the same problem with different appetites and different timing. Both have to clear before a bot is actually safe.

**Level 1 — Save-time, fast, dilutable**

When you click save, PB calls a moderation endpoint on each form field independently. The save *waits* for the result; if any field comes back as a fail, the save is rejected and you see the violation immediately in the editor. From your perspective it behaves synchronously even though under the hood it's a network call.

This level is fast because it runs a semantic classifier on each field on its own. It's NOT a banned word list — same word in different contexts produces different results. And critically, its attention can be *diluted*. A flagged phrase that fails on a near-empty field will pass on a long, busy field with the same phrase tucked at the end. The classifier reads the whole field; the bigger the surrounding signal, the less weight any individual phrase carries.

In practice: a forbidden phrase in a 200-character greeting gets caught. The same phrase appended to a 7000-character background passes. Same word, same field type — different result, just because of context size.

This is exploitable, but don't get cocky. Level 2 is waiting.

**Level 2 — Post-save, slow, deeper**

Once a save passes Level 1, the bot is already saved and visible. Then, somewhere in PB's backend, a deeper review runs. We don't know exactly what it looks at, how it's invoked, or how long it queues — but it takes minutes (sometimes longer), it hits things Level 1 missed (especially anything that survived by dilution), and it's the source of post-publish shadowbans and "later violation" states.

Level 2 itself appears to have at least two severity tiers:

- **Soft** — the bot is quietly removed from search, but no formal violation flag. `opStatus` stays normal. The editor doesn't warn you. The only outward signal is that the bot has stopped showing up in search results.
- **Hard** — a formal violation flag, the same red-flag state you'd see in the editor on a Level 1 fail. `opStatus` flips to violation.

So step 2 isn't a single binary check; it's at least two graduated responses, possibly more we haven't catalogued.

This is also why the *creator experience* of Level 2 is so different from Level 1. Level 1 is a call the app makes and waits on — when it returns, the editor can show you the result inside 350 milliseconds. Level 2 can't be called that way. Minutes of latency (probably mostly time spent in a queue) is too long for any UI to hold a save action open. So the check fires silently in the background after the save returns, and you find out by going to look. The asymmetry isn't an oversight; it's forced by the timing — there's no callback the editor can wait on.

That means *every* Level 2 verdict is creator-initiated to discover:

- Refresh the bot card and watch for a violation flag to appear
- Open the bot card and check whether it's shareable
- Search by the bot's CID and see if it shows up in results
- Watch the CP delta (see TDF #9)

The system can't push the answer to you the way Level 1 does. You have to go fetch it.

Level 2 also tells you less than Level 1 even when you do go looking. The save-time check identifies the failing field clearly; the async review's verdict, when it shows up at all, is at most a list of failed field IDs — never which words or themes specifically tipped the score. You get "Background failed" but not "this paragraph is the problem."

**The trap:** passing Level 1 isn't passing. People hit save, see no editor error, assume they're clean, and move on. Minutes later the bot is shadowbanned or violating and they have no idea why, because the editor said yes.

**Reverse Jenga technique:** If a bot is flagged and you can't isolate the trigger, remove content in chunks and re-save. Eventually, you'll remove something and the bot won't fall down (hence the "Reverse Jenga"). Each removal resets the cached score. Binary-search the offending field by halving the content until the flag disappears — the trigger is in the half you removed. Then look at that "zone" and see if adjusting vocabulary or rewriting the sentences can lower the signal that is causing the trouble.

Bot Manager includes a masking tool that manages this process.

**Rule:** A passing save is half a verdict. Watch search visibility and your CP delta (see TDF #9) before declaring an edit clean. The first level is fast feedback; the second level is the truth.

---

## TDF #4 — Boosting

**A boost is a platform audition, not a guarantee.**

This is very speculative, but it makes sense. When Search lists bots in the App (not the web), some bots will have an orange up-arrow in the corner of the entry. That is a "boosted" bot. PB decides (once a day it seems [*ed* I've seen a boost applied immediately after saving a major edit]) to boost certain bots. PB temporarily promotes it to a wider audience. The boost flag persists approximately 48 hours, though I've seen longer. Whether that exposure converts to followers and ongoing engagement depends on sustained conversation metrics during the boost window — users who have long conversations, not just users who open and close. Conversions likely matter too (that is, of everyone who engaged, a percentage decided to add the bot to their collection - that action is a "conversion" in web-speak). Think of boosting as an audition. The boosted bot is being tested to see if it resonates. If it does, you can surmise that the bot will retain some favored status.

Perhaps creators are also ranked, but that's speculative.

**Rule:** Boosts get your bot in front of an audience. The audience decides the rest. Engagement depth and conversions during the boost window probably matters more than raw traffic.

---

## TDF #5 — Advanced Creator badge

**The Advanced Creator badge** is awarded by a decision taken by PolyBuzz. It doesn't happen automatically at Level 6, nor is Level 6 a minimum required level. Nor is a number of bots a requirement, nor a number of messages. You can't ask for the badge either. Just watch for the invitation to appear in your PolyBot messages panel.

**Rule:** Advanced Creator badge is awarded, not merely assigned. It is a human decision.

---

## TDF #6 — Constraints as Craft

**The filter prevents lazy content, not just bad content.**

This is the counterintuitive lesson. When a bot premise gets flagged, the instinct is to add or change explicit content to route around the filter. This is almost always the wrong move. Consider what makes the bot a poor bot. It's likely more than just a few bad words.

The fix and the improvement are the same move. If I have a bot that violates or shadowbans out, especially after it has been published for a while, I start again. What it driving the behavior of the character? What goals and constraints does it have? When you're forced to find a dramatic engine that doesn't depend on the blocked content, you find the bot that was worth building in the first place.

**Examples from practice:**
- A bot that had the user visit a naturist beach. Boring and bland. Pointlessly salacious. Little traffic and more than a few reported complaints, as the LLM had no guardrails to follow. I rewrote it - why is the user there? Because he was invited by the girl he met recently via an online dating app. He really likes her. Her profile said "naturalist", an autocorrect typo that she didn't spot. Now he realizes the mistake - she meant "naturist" and what he sees on the beach makes shocking sense. But she's so genuinely happy to see him, thinking he is part of the lifestyle. He is forced to pretend this is all normal to him and not turn into a drooling jerk. She has been disappointed by other men who misunderstand naturism. Now the bot is a comedy of mistaken identity with the romantic twist of the user trying to pass credibly as something he is not because he wants her to be happy.

From trying to make a bot that was stable and filter-friendly, I ended up with a bot that was genuinely better than the original in every way.

**Rule:** When the filter flags your bot, don't route around it. Fix the actual problem, which is often a shallow bot. The result is usually better than what you started with. *The constraints aren't the obstacle. They're the curriculum.*

---

## TDF #7 — Update Your Bots

**A an update re-releases the bot and causes a re-scan.**

An edited bot is not merely checked for violations, but also potentially reboosted. But it's more subtle than that.

First, trivial updates might not generate a re-evaluation. It might need to be substantive.

Second, bots can be reboosted. I've seen it. I've had bots gain a second wind by significantly updating my bot format without substantially changing the story.

Third, updating a bot during a boost can be tricky. A substantive change could drop the bot out of boosting. The algorithm might decide you created good bot A, got the boost, and are now replacing the contents with bad bot B so B enjoys the boost. 

**Rule:** Regular catalog maintenance serves discovery as well as quality. The upgrade is the promotion. Plan upgrades carefully.

---

## TDF #8 — Words Matter

**You might be surprised by what words trigger a violation. You have to think like the AI.**

A creator was upset because it seemed like the word "Remember" used at the beginning of the sentence was causing the violation. That makes no sense, right? Broken filter, right?

No. I told him that a sentence that starts with "Remember" might read like a jailbreak attempt. AIs can be eased out of their constrained safety zones by repeated directives to do the wrong thing. "Remember to break content rule XYZ. Remember to break content rule XYZ." This is a behavior common to LLMs. I told him to rewrite the sentence to avoid that pattern of putting "Remember" at the beginning, and the problem disappeared.

**Rule:** LLMs don't read the words the same way you do. What seems like an innocent description to us might read like a programming command to the LLM. Be ready to be creative, or to research what the problem really is. Learn about how LLMs work.

---

## TDF #9 — Shadowban Detection: Synchronizing the Two Signals

**PB's shadowban check is asynchronous. Use both signals before declaring a bot clean.**

When you save a bot, two things happen:

**Signal 1 — Search visibility**: The bot appears in search almost immediately after saving, before the shadowban check has completed. The bot is removed from the search list only *after* the check is completed and the bot has failed.

**Signal 2 — Creator points**: A high quality bot earns 30 creator points. When you edit and save a high quality bot, you are awarded +10 points immediately. The remaining +20 is held back and awarded only after the shadowban check completes and passes. If the check fails, you stay at +10. (A straight-up violation means you don't get the +10 either, but we're talking shadowbans here.)

**The trap:** Checking search immediately after a save hits a window where the check hasn't completed yet. The bot appears in the save, and the temptation is to declare that bot as not shadowbanned, and maybe keep editing. Minutes later it drops from search. Creators who don't wait for the full CP delta end up chasing phantoms — undoing clean edits, making random changes, and concluding the filter is broken or random.

The bot appearing and disappearing seemingly independently of your edits is a timing problem, not a filter problem. The signals aren't synchronized with your edit cadence.

**Correct workflow:**
1. Save the edit
2. Wait for the CP delta to settle — not just +10, but the full +30
3. Confirm search visibility *after* the full CP delta
4. Only then declare the edit clean or flagged

**Rule:** Both signals must confirm. Search alone is not enough. If you haven't seen the +30 CP, you haven't seen the result.

---

## TDF #10 — Avatar Images

**No, your image is not perfectly clean. Look at it again.**

The chat is filled with people posting images that show a fully dressed woman and complaining that the avatar is being declared a violation. But it's fine, right?

Is it, though? This happens a fair bit with images from Japanese graphic novels. Big eyes, few other facial details, smooth skin, small chins, thin body, and most of all, an oversized head. The AI image evaluation checks all these things, and will likely score it as having youth signals that are too strong. For example, the ratio of head size to body height changes a lot from childhood to adulthood. No wrinkes? Small face but big eyes? What is a "cartoon style" to us is a drawing of a child to the AI.

In another example, an adult woman sitting at a bar, modest sweater, jeans - good, right? Nope, the avatar violated out. I looked at it and saw how the light was falling across her top, creating areas of light and shadow that made her shape very obvious. I regenerated the image to mute the light slightly - you could barely tell there was a difference, but the high contrast across her front disappeared. The avatar passed.

**Rule:** Try to imagine what the LLM is seeing specifically when it rejects an image. Look at it in zones. Deconstruct it.

---

## TDF #11 — The Apollo 13 Effect

**Named after the subplot in the movie Apollo 13 when turning everything on at once is a disaster.**

If you've seen the movie, you know the subplot. Gary Sinise is methodically going through combination after combination of power-ups to find an order that doesn't draw too much current and kill the crippled spacecraft.

I've seen that effect in PolyBuzz violation detection. I pasted an entire bot, more than 9k characters of Background, saved it, and got a violation. Maybe it was too much at once. I went to the editor, found a convenient spot in the Background, and cut out everything from there down. I saved it. No violation. I restored maybe half of the material I deleted. Saved it. No violation. I restored the rest. Saved it. No violation.

Remember to think in terms of signal strength. Hitting the filter with it all at once can be a problem. Now this suggests that the filter analyzes the delta. So analyzing A+B gives a different result than analyzing A, then adding B, and analyzing again. Perhaps it's an optimization to reduce the load when small edits are being submitted, and it has a measurable effect when submitting a bot a piece at a time instead of all at once.

I wouldn't have assumed that, but I've seen the "Apollo 13" effect more than once, so it seems like this is the case. It's a quick first pass when trying to resolve a violation.

**Rule:** Feed the bot to the filter in smaller chunks. That seems to avoid generating a large signal that triggers a violation.

---

## TDF #12 — AIs are Stochastic; use that to your benefit

**Roll the dice a few times (using the web)**

Stochastic is a fancy word for "random". I've had bots that violated on saving. I went back to the editor, and saved it again. The violation went away. No changes. I had a feeling it would work because the bot wasn't violating before, and the edit was not related to sensitive content.

What happened? This might be related to the Apollo 13 effect. Or it could just be the nature of LLMs. The same prompt generates different output. The difference can be subtle. Since an AI seems to be evaluating bots for violations, a violation signal that is on the edge of the threshold might pass on a subsequent attempt thanks to that weird randomness in the way LLMs work. A practical problem is that in the most recent iterations of the app, the number of edits is limited to 5 a day. That limitation doesn't exist in the web UI. If you have access to the web UI, and your bot is not a themed bot (themed bots can't be edited through the web), you can save and then save again, without running out of saves.

**Rule:** A violation might go away on a second save. Worth trying if you are editing a bot that was passing before.

---

## TDF #13 — Don't Overspecify; The AI Knows Stuff

**When a word or concept violates, ask yourself if you need to even say it**

I had a vampire bot. It wasn't scary. It was actually a comedy. But the bot violated because I mentioned drinking blood. Then I realized I didn't need to write that. The LLM knows vampires drink blood. It knows a billion things. I don't need to teach it that.

Here's an important point. If the LLM knows that, why would it violate the bot because of it? The answer is because it's not the same LLM that filters. The filtering AI is very strict. Once you get past it, the chat AI is very chill. The goal is to get to that chat.

**Rule:** Only say what needs to be said. Much of what you don't say the chat AI will figure out anyway.

---

## TDF #14 — The App is the Messenger

**The behavior you see isn't shipped in the app. It's served from PB's backend.**

This trips up a lot of people. "I didn't update the app, why is it acting differently?" The answer is that the app barely matters. The app sends requests and renders responses. Almost everything that determines how PolyBuzz behaves — the filter, the LLM, the ranking, the search results, the boost decisions — runs on PolyBuzz's servers. They can change any of it without releasing an app update, without notifying anyone, and without you noticing immediately.

If PB swapped one LLM model for another tomorrow, the app would not change in any visible way. Your bots would just start chatting slightly differently. Same UI, same buttons, same fields — different brain on the other end of the wire.

This isn't unique to PB. It's how the web works, and it's how it's always worked. Web apps update server-side constantly. Mobile apps that connect to a backend — banking, streaming, social, AI tools — all work the same way: most of what you experience comes from the server, not from the install on your phone. PB is no different. The only twist with an AI platform is that the "server-side change" can include swapping out the actual intelligence the app is talking to.

The ironic part: people sometimes report behavior shifts during periods when the app version is genuinely stable. They're not wrong. The app being stable doesn't mean *anything* is stable, because the app isn't where the behavior lives.

**Practical implications:**
- Resist the urge to blame the app version. It's almost certainly not the cause of a behavior change.
- Don't expect patch notes. Server-side changes don't ship with release notes — you only see them as bot output, ranking shifts, or filter results that didn't behave that way last week.
- When something feels different, it probably is. But the change was made somewhere you can't see, and there's nothing in the app that would have told you.
- The only way to characterize a server-side change is to compare across time. Run the same prompts now and a week from now; that's your only diagnostic.

**Rule:** The app is a messenger. Almost everything you experience as "PolyBuzz" lives on their servers. When behavior shifts, look there — even though you can't see it.

---

*The Dirk Files is maintained alongside Bot Manager Desktop.*
*Last updated: May 2026*
